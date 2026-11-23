import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Compass, ExternalLink, Library, Search, X } from 'lucide-react';
import { PROJECTS_DATA, type ProjectItem } from '../../data/projectsData';

const categories = [...new Set(PROJECTS_DATA.map(project => project.category))];

function relatedProjects(project: ProjectItem) {
  return PROJECTS_DATA.filter(other => other.id !== project.id).map(other => ({
    project: other,
    shared: other.technologies.filter(tech => project.technologies.includes(tech)),
  })).filter(match => match.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length).slice(0, 3);
}

export function ProjectsModal() {
  const [params, setParams] = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const isIsland = params.get('view') === 'island';
  const selected = PROJECTS_DATA.find(project => project.id === params.get('project'));
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = PROJECTS_DATA.filter(project => {
    const text = [project.title, project.tagline, project.description, project.category,
      ...project.technologies].join(' ').toLowerCase();
    return (!category || category === project.category) && terms.every(term => text.includes(term));
  });

  function change(values: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace, preventScrollReset: true });
  }

  useEffect(() => {
    if (isIsland) return;
    const panel = dialog.current;
    panel?.showModal();
    return () => panel?.close();
  }, [isIsland]);

  useEffect(() => {
    if (selected) heading.current?.focus({ preventScroll: true });
  }, [selected]);

  if (isIsland) return (
    <button className="shelf-launch" onClick={() => change({ view: '' })}>
      <Library size={18} /> Browse {PROJECTS_DATA.length} projects
    </button>
  );

  const related = selected ? relatedProjects(selected) : [];
  const close = () => change({ view: 'island', project: '' });
  return (
    <dialog ref={dialog} className="project-shelf" aria-labelledby="shelf-title"
      onCancel={event => { event.preventDefault(); if (selected) change({ project: '' }); else close(); }}
      onClick={event => { if (event.target === dialog.current) {
        const rect = dialog.current.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      } }}>
      <div className="shelf-head">
        <div><span className="shelf-imprint">Grand Mage’s Archive</span><h1 id="shelf-title">Project shelf</h1></div>
        <button className="shelf-island" onClick={close}><Compass size={17} /> Explore island</button>
      </div>
      {selected ? (
        <article className="shelf-record" key={selected.id}>
          <button className="shelf-back" onClick={() => change({ project: '' })}><Library size={16} /> Back to shelf</button>
          <p className="shelf-category">{selected.category}</p>
          <h2 ref={heading} tabIndex={-1}>{selected.title}</h2>
          <p className="shelf-lede">{selected.tagline}</p>
          <p>{selected.description}</p><p>{selected.details}</p>
          <div className="shelf-tags" aria-label="Find projects using this technology">
            {selected.technologies.map(tech => <button key={tech} title={'Find projects using ' + tech}
              onClick={() => change({ q: tech, category: '', project: '' })}>{tech}</button>)}
          </div>
          <div className="shelf-links">
            <a href={selected.githubUrl} target="_blank" rel="noreferrer">Source code <ExternalLink size={15} /></a>
            {selected.liveDemoUrl && <a href={selected.liveDemoUrl} target="_blank" rel="noreferrer">Live demo <ExternalLink size={15} /></a>}
          </div>
          {related.length > 0 && <section className="shelf-thread" aria-label="Related projects">
            <h3>Follow the technology</h3>
            {related.map(({ project, shared }) => <button key={project.id} onClick={() => change({ project: project.id })}>
              <span>{project.title}</span><small>{shared.join(' · ')}</small>
            </button>)}
          </section>}
        </article>
      ) : (
        <>
          <div className="shelf-filters">
            <label className="shelf-search"><Search size={18} />
              <input type="search" aria-label="Search projects" placeholder="Search projects or technologies"
                value={query} onChange={e => change({ q: e.target.value }, true)} />
            </label>
            <select aria-label="Project category" value={category} onChange={e => change({ category: e.target.value })}>
              <option value="">All categories</option>
              {categories.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div className="shelf-results">
            <p className="shelf-count" role="status">{results.length} {results.length === 1 ? 'project' : 'projects'}</p>
            {results.length ? <div className="shelf-grid">
              {results.map(project => <button className="shelf-book" key={project.id}
                style={{ borderInlineStartColor: project.accentColor }} onClick={() => change({ project: project.id })}>
                <small>{project.category}</small><strong>{project.title}</strong>
                <span>{project.tagline}</span>
                <em>{project.technologies.slice(0, 3).join(' · ')}</em>
              </button>)}
            </div> : <div className="shelf-empty"><BookOpen /><p>No projects match these filters.</p>
              <button onClick={() => change({ q: '', category: '' })}><X size={15} /> Clear filters</button></div>}
          </div>
        </>
      )}
      <footer className="shelf-foot"><Link to="/products">Visit the Rune Workshop</Link></footer>
    </dialog>
  );
}
