import React, {useEffect, useState} from 'react'
import{ searchItems, products } from '../../data/data.js'
const Searchbar = () => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [justChosen, setJustChosen] = useState(false);

  const dropdownRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const itemsRefs = React.useRef([]);
  itemsRefs.current = [];

  React.useEffect(() => {
      const timer = setTimeout(() => {
          const query =input.trim().toLowerCase();
          if(!query){
              setSuggestions([]);
              setShowDropdown(false);
              setSelectedItem(null);
              setJustChosen(false);
              return;
          }

          const filtered = searchItems.filter(item => item.toLowerCase().includes(query));

          setSuggestions(filtered);
          if(!justChosen){
            setShowDropdown(filtered.lenght>0);
          }
      }, 200);


      return () => clearTimeout(timer);
  }, [input, justChosen]);

  React.useEffect(() => {
        setActiveIndex(-1);
    },[showDropdown, suggestions]);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {            document.removeEventListener("mousedown", handleClickOutside);
        }
    },[]);

    useEffect(() => {

        const indexToScroll = activeIndex >= 0 ? activeIndex : hoverIndex;
        if (indexToScroll >= 0 && itemsRefs.current[indexToScroll]) {
            itemsRefs.current[indexToScroll].scrollIntoView({
                behavior: "smooth",block : "nearest"
            });
        }
    }, [activeIndex, hoverIndex]);

    const choose = (value) => {
        const product = products.find(p => p.name === value);
        setInput(value);
        setSelectedItem(product || null);
        setShowDropdown(false);
        setJustChosen(true);
        setActiveIndex(-1);
        setHoverIndex(-1);
    }

    const handleKeyDown = (e) => {
        if(!showDropdown || suggestions.length === 0) {
            if (e.key === "Escape"){
                setShowDropdown(false);
                return;
            }  
        }

        switch(e.key){
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : suggestions.length - 1));
                break;

            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? -1 : prev - 1));
                break;

            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0){
                   choose(suggestions[activeIndex]); 
                } else if (suggestions.length > 0){
                    choose(suggestions[0]);
                }
                break;

            case "Escape":
                setShowDropdown(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
                break;

            default:
                break;
        }
    }
  return (
    <div className='w-full max-w-md mx-auto mt-10 relative' ref={dropdownRef}>
      <input type="text"
             placeholder="Chercher..."
             value={input}
             onChange={(e) => {
                setInput(e.target.value);
            setJustChosen(false);
        if(selectedItem){
            setSelectedItem(null);
        }}}
             onKeyDown={handleKeyDown}
             onFocus={() => {
                if(input.trim()){
                    const filtered = searchItems.filter(item => item.toLowerCase().includes(input.trim().toLowerCase()));
                    if(filtered.length > 0){
                        setSuggestions(filtered);
                        setShowDropdown(true);
                    }
                }
             }}
             
             autoComplete="off"
             ref={inputRef}
             className='input input-success w-full border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
             
            
      />
        {showDropdown && (
            <ul className='absolute w-full max-h-60 overflow-y-auto border bg-white border-gray-300 mt-1 z-10'>
                {suggestions.map((item, index) => {
                    const isActive = index === activeIndex;
                    const isHover = index === hoverIndex;
                    return (
                        <li key={item} ref={(el) => (itemsRefs.current[index] = el)} onClick = {() => choose(item)}
                        onMouseEnter = {() => setHoverIndex(index)}
                        onMouseLeave = {() => setHoverIndex(-1)}
                        className={`px-4 py-2 cursor-pointer trasition-all ${isActive || (!isActive && isHover) ? "bg-primay text-white": ""}`}
                        >
                            {item}
                        </li>
                    )
                })}

            </ul>
        )}
    </div>
  )
}

export default Searchbar
