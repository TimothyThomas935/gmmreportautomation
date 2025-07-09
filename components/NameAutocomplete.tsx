"use client";

import { useState } from "react";
import { getNameSuggestions } from "../queries/getNameSuggestions";

type Miner = {
  FirstName: string;
  LastName: string;
  TagID: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (miner: Miner) => void;
};

const NameAutocomplete = ({ value, onChange, onSelect }: Props) => {
  const [suggestions, setSuggestions] = useState<Miner[]>([]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.length > 1) {
      const matches = await getNameSuggestions(val); // should return Miner[]
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (miner: Miner) => {
    onChange(miner.FirstName);
    setSuggestions([]);
    if (onSelect) onSelect(miner);
  };

  return (
    <div className="relative w-64">
      <input
        type="text"
        placeholder="Enter first name"
        value={value}
        onChange={handleInputChange}
        className="border rounded px-3 py-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded shadow-md z-10 mt-1 max-h-40 overflow-y-auto">
          {suggestions.map((miner, index) => (
            <li
              key={index}
              className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleSuggestionClick(miner)}
            >
              {miner.FirstName} {miner.LastName} ({miner.TagID})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NameAutocomplete;
