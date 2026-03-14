"use client";

import usePlacesAutocomplete from "use-places-autocomplete";
import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "./GoogleMapsProvider";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Ex: Curitiba, PR",
  className = "",
}: CityAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ["(cities)"],
      componentRestrictions: { country: "br" },
    },
    debounce: 300,
    defaultValue: value,
    cache: 24 * 60 * 60,
  });

  useEffect(() => {
    if (value !== inputValue) {
      setValue(value, false);
    }
  }, [value, setValue, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: any) => {
    const { description } = suggestion;
    setValue(description, false);
    onChange(description);
    clearSuggestions();
    setShowSuggestions(false);
  };

  if (!isLoaded) return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled
    />
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInput}
        onFocus={() => setShowSuggestions(true)}
        disabled={!ready}
      />
      {showSuggestions && status === "OK" && (
        <ul className="absolute left-0 right-0 z-[100] mt-2 max-h-60 overflow-auto rounded-2xl border border-white/10 bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-xl">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="cursor-pointer rounded-xl px-4 py-3 text-sm text-white transition hover:bg-white/5"
            >
              <span className="font-semibold text-[var(--accent)]">
                {suggestion.structured_formatting.main_text}
              </span>
              <span className="ml-2 text-xs text-[var(--ink-muted)]">
                {suggestion.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
