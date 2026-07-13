import React from 'react';
import { HistoryRecord, GradingResult, StudentInfo } from '../types';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  history: HistoryRecord[];
  onLoad: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}

export const HistoryPanel = ({ history, onLoad, onDelete }: Props) => {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Clock size={48} className="text-gray-800 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600">No History Yet</h3>
        <p className="text-[10px] text-gray-700 mt-2 uppercase font-medium">
          Graded papers will appear here after you save them
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div className="w-2 h-4 bg-accent-blue rounded-full" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Grading History</h2>
        <span className="ml-auto text-[10px] text-gray-600 font-bold uppercase">{history.length} record{history.length !== 1 ? 's' : ''}</span>
      </div>

      {history.map((record, idx) => (
        <motion.div
          key={record.id}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="group bg-card border border-gray-800 rounded-2xl p-4 hover:border-accent-blue/40 hover:bg-accent-blue/5 transition-all duration-200 cursor-pointer"
          onClick={() => onLoad(record)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-bold font-mono ${record.result.grade?.startsWith('A') ? 'text-accent-green' : 'text-accent-blue'}`}>
                  {record.result.grade}
                </span>
                <span className="text-xs font-mono text-gray-400">{record.result.total_score}</span>
              </div>
              <p className="text-xs font-bold text-gray-300 truncate">
                {record.studentInfo.name || 'Unknown Student'}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5 uppercase font-medium">
                {record.studentInfo.courseCode || '—'} · {record.date}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-gray-600 transition-all"
              >
                <Trash2 size={13} />
              </button>
              <ChevronRight size={16} className="text-gray-700 group-hover:text-accent-blue transition-colors" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
