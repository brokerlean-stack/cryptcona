"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  placeholder?: string;
  icon: React.ReactNode;
  onSelect: (value: string) => void;
}

export default function SearchableSelect({
  label,
  options,
  placeholder = "Search...",
  icon,
  onSelect,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] font-semibold text-zinc-500 tracking-normal px-1">
        {label}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#1a211e] border border-white/5 rounded-lg py-5 pl-14 pr-6 text-sm font-medium cursor-pointer flex justify-between items-center transition-all ${isOpen ? "border-brand-mint/30 ring-1 ring-brand-mint/30" : "hover:border-white/10"}`}
      >
        <div className="absolute inset-y-0 left-5 flex items-center text-zinc-600 transition-colors">
          {icon}
        </div>

        <span className={selected ? "text-white" : "text-zinc-700"}>
          {selected ? selected.label : placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`text-zinc-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 top-full left-0 w-full mt-2 bg-[#12161b] rounded-lg border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <Search size={16} className="text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Start typing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-zinc-600 text-white font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(option);
                      onSelect(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="px-6 py-4 hover:bg-brand-mint/10 cursor-pointer flex justify-between items-center transition-all text-sm font-semibold border-b border-white/[0.02] last:border-none"
                  >
                    <span
                      className={
                        selected?.value === option.value
                          ? "text-brand-mint"
                          : "text-zinc-300"
                      }
                    >
                      {option.label}
                    </span>
                    {selected?.value === option.value && (
                      <Check size={18} className="text-brand-mint" />
                    )}
                  </div>
                ))
              ) : searchTerm ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const customValue = searchTerm;
                    setSelected({ label: customValue, value: customValue });
                    onSelect(customValue);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="px-6 py-4 hover:bg-brand-mint/10 cursor-pointer flex flex-col transition-all border-b border-white/[0.02]"
                >
                  <span className="text-zinc-500 text-[10px] font-semibold tracking-normal mb-1">
                    Use Custom Value
                  </span>
                  <span className="text-white font-bold">{searchTerm}</span>
                </div>
              ) : (
                <div className="px-6 py-4 text-xs text-zinc-600 font-bold tracking-normal text-center">
                  Start typing...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
