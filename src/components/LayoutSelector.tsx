import React from 'react';
import { LayoutType, LayoutOption } from '../types';
import { PanelLeft, LayoutList, LayoutGrid, Columns } from 'lucide-react';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onSelectLayout: (layout: LayoutType) => void;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    bslibFunction: 'bslib::page_sidebar()',
    description: 'Classic R Shiny sidebar layout with left parameters panel and main chart area.',
  },
  {
    id: 'navbar',
    name: 'Navbar Tabs',
    bslibFunction: 'bslib::page_navbar()',
    description: 'Top navigation bar with tabbed views for Chart, Indicators, Data Table & R Code.',
  },
  {
    id: 'grid',
    name: 'Bento Grid',
    bslibFunction: 'bslib::page_fillable()',
    description: 'Responsive multi-card bento grid with equal height fillable containers.',
  },
  {
    id: 'split',
    name: 'Split Screen',
    bslibFunction: 'bslib::page_fluid()',
    description: 'Top parameters toolbar with side-by-side dual column chart and indicator subplots.',
  },
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onSelectLayout,
}) => {
  const getIcon = (id: LayoutType) => {
    switch (id) {
      case 'sidebar':
        return <PanelLeft className="w-4 h-4" />;
      case 'navbar':
        return <LayoutList className="w-4 h-4" />;
      case 'grid':
        return <LayoutGrid className="w-4 h-4" />;
      case 'split':
        return <Columns className="w-4 h-4" />;
    }
  };


  return (
    <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
      {LAYOUT_OPTIONS.map((opt) => {
        const isActive = currentLayout === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelectLayout(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-purple-700 text-white shadow-xs border border-purple-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={`${opt.name} (${opt.bslibFunction}) - ${opt.description}`}
          >
            {getIcon(opt.id)}
            <span className="hidden sm:inline">{opt.name}</span>
          </button>
        );
      })}
    </div>
  );
};
