/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Navbar from '@/components/Navbar';
import FlowchartEditor from '@/components/flowchart/FlowchartEditor';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        <FlowchartEditor />
      </main>

      <footer className="border-t py-6 bg-white/50">
        <div className="max-w-screen-2xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Process Mapping. Built for Clarity and Structure.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-center" />
    </div>
  );
}

