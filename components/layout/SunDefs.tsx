/** Símbolo #sol usado por todo o site via <use href="#sol" />. */
export default function SunDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="sol" viewBox="0 0 24 24">
          <g fill="currentColor">
            {/* Palma principal bem maior e preenchendo a base */}
            <path d="M12 9.5c-4.2 0-7.5 2.5-7.5 5.8 0 2.8 2.8 5.2 7.5 5.2s7.5-2.4 7.5-5.2c0-3.3-3.3-5.8-7.5-5.8z" />
            
            {/* 4 dedos maiores e mais próximos do topo */}
            <ellipse cx="4.8" cy="8.2" rx="2.3" ry="3.2" transform="rotate(-18 4.8 8.2)" />
            <ellipse cx="9.6" cy="4.8" rx="2.2" ry="3.3" transform="rotate(-6 9.6 4.8)" />
            <ellipse cx="14.4" cy="4.8" rx="2.2" ry="3.3" transform="rotate(6 14.4 4.8)" />
            <ellipse cx="19.2" cy="8.2" rx="2.3" ry="3.2" transform="rotate(18 19.2 8.2)" />
          </g>
        </symbol> 
      </defs>
    </svg>
  );
}
