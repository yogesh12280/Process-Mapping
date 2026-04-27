import React from 'react';
import { Download, Save, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Process <span className="text-primary">Mapping</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex items-center gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent('workflow:save'))}
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
