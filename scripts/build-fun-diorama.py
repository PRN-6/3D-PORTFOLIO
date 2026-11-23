"""Build the sunset scene with the portfolio's original rigs. Python standard library only."""
import argparse
import json
import math
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TAU = 2 * math.pi


def add(a, b):
    return [x + y for x, y in zip(a, b)]


def sub(a, b):
    return [x - y for x, y in zip(a, b)]


def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]


def quat(axis, degrees):
    half = math.radians(degrees) / 2
    return [v * math.sin(half) for v in axis] + [math.cos(half)]


def rotate(q, v):
    t = [2*x for x in cross(q[:3], v)]
    return add(v, add([q[3]*x for x in t], cross(q[:3], t)))


def srgb(value):
    s = value / 255
    return s / 12.92 if s <= .04045 else ((s + .055) / 1.055) ** 2.4


class Scene:
    def __init__(self):
        self.data = {k: [] for k in ('nodes', 'meshes', 'materials', 'accessors', 'bufferViews',
                                     'textures', 'samplers', 'images', 'skins', 'animations')}
        self.data.update(asset={'version': '2.0', 'generator': 'PRINSON / Ring at Sundown'},
                         extensionsUsed=['KHR_draco_mesh_compression'],
                         extensionsRequired=['KHR_draco_mesh_compression'],
                         scene=0, scenes=[{'name': 'Ring at Sundown', 'nodes': []}])
        self.binary = bytearray()

    def append(self, key, obj):
        index = len(self.data[key])
        self.data[key].append(obj)
        return index

    def node(self, name, parent=None, **attributes):
        index = self.append('nodes', dict(name=name, **attributes))
        if parent is None:
            self.data['scenes'][0]['nodes'].append(index)
        else:
            self.data['nodes'][parent].setdefault('children', []).append(index)
        return index

    def view(self, raw):
        self.binary.extend(bytes(-len(self.binary) % 4))
        start = len(self.binary)
        self.binary.extend(raw)
        return self.append('bufferViews', dict(buffer=0, byteOffset=start, byteLength=len(raw)))

    def floats(self, rows):
        size = len(rows[0])
        raw = struct.pack('<' + 'f' * size * len(rows), *(v for row in rows for v in row))
        return self.append('accessors', dict(bufferView=self.view(raw), componentType=5126,
                           count=len(rows), type={1:'SCALAR', 3:'VEC3', 4:'VEC4'}[size],
                           min=list(map(min, zip(*rows))), max=list(map(max, zip(*rows)))))

    def import_actor(self, name):
        raw = (ROOT / 'public/models/transition' / (name.lower() + '.glb')).read_bytes()
        size = struct.unpack_from('<I', raw, 12)[0]
        source = json.loads(raw[20:20+size])
        binary = raw[28+size:]
        views, accessors = {}, {}

        def view(i):
            if i not in views:
                original = source['bufferViews'][i]
                start = original.get('byteOffset', 0)
                views[i] = self.view(binary[start:start+original['byteLength']])
            return views[i]

        def accessor(i):
            if i not in accessors:
                a = source['accessors'][i].copy()
                if 'bufferView' in a:
                    a['bufferView'] = view(a['bufferView'])
                accessors[i] = self.append('accessors', a)
            return accessors[i]

        # Both source GLBs have one costume, one embedded face atlas and one rig.
        assert all(len(source[k]) == 1 for k in ('meshes','materials','textures','samplers','images','skins'))
        image = source['images'][0]
        image['bufferView'] = view(image['bufferView'])
        texture = self.append('textures', dict(source=self.append('images', image),
                              sampler=self.append('samplers', source['samplers'][0])))
        material = source['materials'][0]
        material['pbrMetallicRoughness']['baseColorTexture']['index'] = texture
        material_id = self.append('materials', material)
        mesh = source['meshes'][0]
        for p in mesh['primitives']:
            p['indices'] = accessor(p['indices'])
            p['attributes'] = {k: accessor(v) for k, v in p['attributes'].items()}
            draco = p['extensions']['KHR_draco_mesh_compression']
            draco['bufferView'] = view(draco['bufferView'])
            p['material'] = material_id
        mesh_id = self.append('meshes', mesh)
        offset = len(self.data['nodes'])
        skin = source['skins'][0]
        skin['inverseBindMatrices'] = accessor(skin['inverseBindMatrices'])
        skin['joints'] = [i + offset for i in skin['joints']]
        if 'skeleton' in skin:
            skin['skeleton'] += offset
        skin_id = self.append('skins', skin)
        bones = {}
        for n in source['nodes']:
            if 'children' in n:
                n['children'] = [i + offset for i in n['children']]
            if 'mesh' in n:
                n.update(mesh=mesh_id, skin=skin_id)
            bones[n['name'][len(name):]] = self.append('nodes', n)
        self.data['scenes'][0]['nodes'].append(bones[''])
        return bones

    def world_point(self, node, point):
        nodes = self.data['nodes']
        parents = {child: i for i, n in enumerate(nodes) for child in n.get('children', [])}
        while node is not None:
            n = nodes[node]
            point = [v*s for v, s in zip(point, n.get('scale', [1]*3))]
            point = add(rotate(n.get('rotation', [0,0,0,1]), point), n.get('translation', [0]*3))
            node = parents.get(node)
        return point

    def save(self, path):
        self.binary.extend(bytes(-len(self.binary) % 4))
        self.data['buffers'] = [dict(byteLength=len(self.binary))]
        meta = json.dumps(self.data, separators=(',', ':')).encode()
        meta += b' ' * (-len(meta) % 4)
        header = struct.pack('<4sIIII', b'glTF', 2, 28+len(meta)+len(self.binary), len(meta), 0x4E4F534A)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(header + meta + struct.pack('<II', len(self.binary), 0x004E4942) + self.binary)


class Geometry:
    """Batch painted architecture by vertex color, preserving named animated pivots."""
    def __init__(self):
        self.positions, self.normals, self.colors = [], [], []

    def face(self, points, color):
        normal = cross(sub(points[1],points[0]), sub(points[2],points[0]))
        length = math.sqrt(sum(v*v for v in normal))
        if length < 1e-12:
            return
        normal = [v/length for v in normal]
        rgb = [srgb(int(color[i:i+2], 16)) for i in (0,2,4)]
        for i in range(1,len(points)-1):
            self.positions.extend((points[0], points[i], points[i+1]))
            self.normals.extend([normal]*3)
            self.colors.extend([rgb]*3)

    def box(self, center, size, color, angle=0):
        points = []
        for x,y,z in ((-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),
                      (-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)):
            p = [x*size[0]/2,y*size[1]/2,z*size[2]/2]
            points.append(add(rotate(quat([0,0,1],angle), p), center))
        for ids in ((0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)):
            self.face([points[i] for i in ids],color)

    def disc(self, x,y,z, r, color, count=36):
        self.face([[x+r*math.cos(TAU*i/count), y+r*math.sin(TAU*i/count), z]
                   for i in range(count)], color)

    def finish(self, scene, name, material, parent=None, **attrs):
        mesh = scene.append('meshes', dict(name=name,primitives=[dict(material=material,
                  attributes=dict(POSITION=scene.floats(self.positions), NORMAL=scene.floats(self.normals),
                                  COLOR_0=scene.floats(self.colors)))]))
        return scene.node(name, parent, mesh=mesh, **attrs)


def build_square(scene, stone):
    town = Geometry()
    town.box([0,-.15,-1.15],[4.85,.27,4.5],'705163')
    town.box([0,-.045,-1.15],[4.78,.09,4.44],'bc8980')
    for row in range(22):
        for col in range(15):
            x = -2.36 + .315*col + (row%2)*.15
            town.box([x,.003,-3.28+row*.20],[.303,.015,.188],
                     ['dcb19a','d0a08c','e4bc9f','dfae96'][(row*13+col*7+row*col)%4])
    # The open arch gives the clock tower a view through to the sunset.
    for x in (-.38,.38):
        town.box([x,.47,-2.56],[.25,.94,.64],'bf766a')
    for i in range(11):
        a,b = i*math.pi/11,(i+1)*math.pi/11
        front = [[r*math.cos(t),.80+r*math.sin(t),-2.21] for r,t in
                 ((.32,a),(.51,a),(.51,b),(.32,b))]
        town.face(front,'d39a82' if i%2 else 'e4b398')
        back = [[x,y,z-.67] for x,y,z in front]
        town.face(back[::-1],'bb796e')
        for k in range(4):
            j=(k+1)%4
            town.face([front[k],back[k],back[j],front[j]],'b78075')
    town.box([0,1.81,-2.55],[1.03,1.16,.74],'c78470')
    town.box([0,2.41,-2.55],[1.15,.085,.85],'905f69')
    town.box([0,2.66,-2.55],[.76,.48,.59],'e0ab88')
    for x in (-.21,0,.21):
        town.box([x,2.67,-2.245],[.105,.25,.024],'8d6468')
    def spire(x,y,z,w,depth,height):
        base=[[x-w,y,z+depth],[x+w,y,z+depth],[x+w,y,z-depth],[x-w,y,z-depth]]
        for k,shade in enumerate(['a27988','916978','986d80','ad8594']):
            town.face([base[k],base[(k+1)%4],[x,y+height,z]],shade)
    spire(0,2.91,-2.55,.49,.4,.73)
    town.disc(0,1.89,-2.16,.325,'96676b')
    town.disc(0,1.89,-2.151,.293,'d8aeb0')
    for i in range(12):
        a=i*TAU/12
        town.box([.243*math.sin(a),1.89+.243*math.cos(a),-2.14],
                 [.016,.052 if i%3==0 else .033,.01],'805f71',-i*30)
    for length,angle in ((.21,12),(.135,-74)):
        a=math.radians(angle)
        town.box([-.5*length*math.sin(a),1.89+.5*length*math.cos(a),-2.12],
                 [.019,length,.013],'604c67',angle)
    town.disc(0,1.89,-2.106,.028,'e4bb88')
    for side in (-1,1):
        for row in range(3):
            x,z=side*(2.16-.28*row),-.43-row*.99
            w,h,d=.78,1.21+.16*(row%2),.9
            town.box([x,h/2,z],[w,h,d],['eec69f','d9a897','f0cdb0'][row])
            # Pitched town-house roof with plaster gable and timber edging.
            peak=h+.37
            for face in (-1,1):
                zz=z+face*d/2
                tri=[[x-w/2,h,zz],[x+w/2,h,zz],[x,peak,zz]]
                town.face(tri if face==1 else tri[::-1],'f2d1aa')
            for sign in (-1,1):
                xx=x+sign*(w/2+.06)
                quad=[[xx,h-.03,z+d*.55],[xx,h-.03,z-d*.55],
                      [x,peak+.025,z-d*.55],[x,peak+.025,z+d*.55]]
                town.face(quad if sign==-1 else quad[::-1],'ac7480')
            for level in (.40,.92):
                for delta in (-.20,.20):
                    town.box([x+delta,level,z+d/2+.012],[.14,.23,.022],'94666c')
                    town.box([x+delta,level+.01,z+d/2+.027],[.026,.23,.015],'ceac91')
            town.box([x,h-.045,z+d/2+.02],[w,.055,.045],'b08475')
            street_x = x-side*(w/2+.018)
            for window_z in (z-.24,z+.23):
                for wy in (.46,.96):
                    town.box([street_x,wy,window_z],[.024,.24,.17],'785d6b')
                    town.box([street_x-side*.018,wy,window_z],[.02,.21,.025],'e5ba97')
                    town.box([street_x-side*.023,wy-.13,window_z],[.06,.035,.21],'ba8976')
            for beam_y in (.14,.72):
                town.box([x,beam_y,z],[w+.045,.034,d+.035],'c19782')
            town.box([x,.30,z+d/2+.019],[.19,.60,.035],'a17a72')
            town.box([x,.32,z+d/2+.04],[.13,.48,.018],'ba927d')
        for k in range(15):
            town.box([side*1.39,.029,.88-k*.29],[.14,.056,.278],
                     ['cfa99b','bf9789','d8b3a0'][k%3])
    for level in (1.26,1.34,2.32,2.88):
        width = 1.10 if level < 2.6 else .82
        town.box([0,level,-2.55],[width,.035,.79],'e2b295')
    for x in (-.46,.46):
        for row in range(8):
            town.box([x,.12+row*.27,-2.176],[.11,.059,.045],'daa18a')
    town.finish(scene,'Sunset Clock Square',stone)


def build(path):
    s=Scene()
    painted=s.append('materials', dict(name='Painted sandstone', doubleSided=True,
                  pbrMetallicRoughness=dict(metallicFactor=0,roughnessFactor=.93)))
    gold=s.append('materials', dict(name='Antique gold and rose enamel', doubleSided=True,
                  pbrMetallicRoughness=dict(metallicFactor=.35,roughnessFactor=.33)))
    build_square(s,painted)
    f,h = s.import_actor('Frieren'),s.import_actor('Himmel')
    nodes=s.data['nodes']
    def pitch(bones,part,degrees):
        nodes[bones[part]]['rotation']=quat([1,0,0],degrees)
    for rig in (f,h):
        for prop in ('Tool','Book'):
            if prop in rig:
                nodes[rig[prop]]['scale']=[.0001]*3
    nodes[f['']].update(translation=[-.43,.014,.22],rotation=quat([0,1,0],82))
    pitch(f,'Head',14)
    pitch(f,'ArmR',-42)
    pitch(f,'ForearmR',-29)
    pitch(f,'HandR',-11)
    # Lower the pelvis onto the back knee. The forward foot is planted under its knee.
    nodes[h['']].update(rotation=quat([0,1,0],-81))
    nodes[h['Pelvis']]['translation']=[0,.238,0]
    for part,deg in [('ThighR',-106),('CalfR',106),('FootR',0),('ThighL',-20),
                     ('CalfL',136),('FootL',-90),('DrapeL',38),('DrapeR',38),('Spine',5),('Head',-6),
                     ('ArmL',-66),('ForearmL',-54),('HandL',-8),
                     ('ArmR',-48),('ForearmR',-70)]:
        pitch(h,part,deg)
    ring=Geometry()
    radius,tube=.031,.0054
    def band(a,b):
        return [(radius+tube*math.cos(b))*math.cos(a),tube*math.sin(b),
                (radius+tube*math.cos(b))*math.sin(a)]
    for i in range(32):
        for j in range(8):
            ring.face([band(TAU*a/32,TAU*b/8) for a,b in
                       ((i,j),(i,j+1),(i+1,j+1),(i+1,j))],'edb65f')
    for sign in (-1,1):
        side=[sign*.014,0,.029]
        tip=[sign*.028,.015,.041]
        for dx in (-.009,.009):
            ring.face([side,[sign*.019+dx,.012,.036],tip],'d78baf')
    ring_id=ring.finish(s,'Flower Ring',gold,f['HandR'],translation=[-.003,-.048,.012])
    target=s.world_point(ring_id,[0,0,0])
    # Solve the elbow bend for the ring height before placing Himmel on the paving.
    low, high = -85.0, -10.0
    for _ in range(24):
        angle = (low + high) / 2
        pitch(h,'ForearmL',angle)
        if s.world_point(h['HandL'],[0,-.049,.014])[1] > target[1] - .014:
            low = angle
        else:
            high = angle
    fingers=s.world_point(h['HandL'],[0,-.049,.014])
    # Align the hands in 3D, preserving ground contact.
    nodes[h['']]['translation']=[target[0]-fingers[0],.014,target[2]-fingers[2]]
    # Author only the moving joints. The kneel and hand contact are the rest pose.
    times=s.floats([[0],[2],[4],[6],[8]])
    anim=dict(name='A Quiet Promise',channels=[],samplers=[])
    def track(node,prop,rows):
        sampler=len(anim['samplers'])
        anim['samplers'].append(dict(input=times,output=s.floats(rows),interpolation='LINEAR'))
        anim['channels'].append(dict(sampler=sampler,target=dict(node=node,path=prop)))
    for node,axis,angles in [(f['Head'],[1,0,0],[14,17,15,13,14]),
            (h['Head'],[1,0,0],[-6,-1,-4,-8,-6]),
            (f['TailTipL'],[1,0,0],[-4,3,-2,-6,-4]),
            (f['TailTipR'],[1,0,0],[-4,1,-3,-7,-4]),
            (h['DrapeR'],[1,0,0],[38,41,39,36,38])]:
        track(node,'rotation',[quat(axis,a) for a in angles])
    track(ring_id,'translation',[[-.003,y,.012] for y in (-.048,-.059,-.048,-.048,-.048)])
    s.data['animations'].append(anim)
    s.save(path)
    print(path, 'ring',target,'presenting fingertips',s.world_point(h['HandL'],[0,-.049,.014]))


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('output', type=Path, help='New GLB output path')
    args=parser.parse_args()
    build(args.output)
