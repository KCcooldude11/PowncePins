"use client";

import { useState } from "react";

type Project = {
  id: string;
  title: string;
  image: string;
  sales: string;
  unitsSold: string;
  inventory: string;
  royalty: string;
  dropStatus: string;
  connected: boolean;
};

const placeholderProjects: Project[] = [
  {
    id: "coming-soon-1",
    title: "Future Character Pin",
    image: "",
    sales: "--",
    unitsSold: "--",
    inventory: "--",
    royalty: "--",
    dropStatus: "Not connected yet",
    connected: false,
  },
  {
    id: "coming-soon-2",
    title: "Fandom Collaboration Pin",
    image: "",
    sales: "--",
    unitsSold: "--",
    inventory: "--",
    royalty: "--",
    dropStatus: "Not connected yet",
    connected: false,
  },
];

export default function ProjectSelector({ connectedProjects }: { connectedProjects: Project[] }) {
  const projects = [...connectedProjects, ...placeholderProjects];
  const defaultProject = connectedProjects[0] || placeholderProjects[0];
  const [selectedId, setSelectedId] = useState(defaultProject.id);
  const selected = projects.find((project) => project.id === selectedId) || defaultProject;

  return (
    <section className="project-picker portal-panel">
      <div className="project-picker-header">
        <div>
          <span className="portal-badge">Your collaborations</span>
          <h2>Choose a project</h2>
          <p className="portal-muted">Select a pin to view its sales, inventory, and royalty snapshot.</p>
        </div>
        <label className="project-select-wrap">
          <span>Project</span>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="portal-input">
            {projects.map((project) => (
              <option key={project.id} value={project.id} disabled={!project.connected}>
                {project.title}{project.connected ? "" : " (coming soon)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="project-showcase">
        <div className="project-art-frame">
          {selected.image ? (
            <img src={selected.image} alt={selected.title} className="project-art" />
          ) : (
            <div className="project-art-placeholder">Coming soon</div>
          )}
        </div>
        <div className="project-details">
          <div className="project-title-row">
            <div>
              <span className="portal-badge">{selected.dropStatus}</span>
              <h3>{selected.title}</h3>
            </div>
            <span className="project-id">{selected.connected ? "LIVE" : "PLANNED"}</span>
          </div>
          <div className="project-metric-grid">
            <Metric label="Sales" value={selected.sales} />
            <Metric label="Units sold" value={selected.unitsSold} />
            <Metric label="Inventory" value={selected.inventory} />
            <Metric label="Your royalty" value={selected.royalty} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="project-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
