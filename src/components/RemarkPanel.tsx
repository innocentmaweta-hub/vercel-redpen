import React from 'react';
import { PenLine, Save } from 'lucide-react';

interface Props {
  remarks: string;
  onChange: (val: string) => void;
  onSave: () => void;
  studentName: string;
}

export const RemarkPanel = ({ remarks, onChange, onSave, studentName }: Props) => {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-4 bg-accent-blue rounded-full" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Examiner Remarks</h2>
        {studentName && (
          <span className="ml-auto text-[10px] text-gray-500 font-bold uppercase truncate max-w-[160px]">
            {studentName}
          </span>
        )}
      </div>

      <div className="flex-1 bg-card border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="h-10 border-b border-gray-800/50 flex items-center px-4 gap-2 bg-sidebar/20 shrink-0">
          <PenLine size={12} className="text-gray-500" />
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">General Remarks</span>
        </div>
        <textarea
          value={remarks}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your examiner remarks here. These will be included when saving the result..."
          className="flex-1 bg-transparent resize-none p-4 text-sm text-gray-300 placeholder:text-gray-700 focus:outline-none leading-relaxed"
        />
      </div>

      <div className="shrink-0">
        <button
          onClick={onSave}
          className="w-full bg-accent-blue text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20"
        >
          <Save size={14} />
          Save Remarks
        </button>
      </div>
    </div>
  );
};
