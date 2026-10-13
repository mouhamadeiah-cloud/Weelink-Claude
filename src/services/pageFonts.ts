// The fonts customers can pick for their pages (the editor's font list and the ready slides).
// Weelink's own screens don't need them, so they load only where pages are shown: the editor and
// published pages. The templates' main fonts come first; the rest follow without blocking.
const MAIN = 'https://fonts.googleapis.com/css2?family=Alexandria:wght@400;700&family=Cairo:wght@400;700&family=El+Messiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&family=Readex+Pro:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
const REST = 'https://fonts.googleapis.com/css2?family=Alkalami&family=Almarai:wght@400;700&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Baloo+Bhaijaan+2:wght@400;700&family=Barlow:wght@400;700&family=Cabin:wght@400;700&family=Changa:wght@400;700&family=DM+Sans:wght@400;700&family=Fira+Sans:wght@400;700&family=Harmattan:wght@400;700&family=Heebo:wght@400;700&family=IBM+Plex+Sans:wght@400;700&family=Inter:wght@400;700&family=Jomhuria&family=Josefin+Sans:wght@400;700&family=Kanit:wght@400;700&family=Katibeh&family=Kufam:wght@400;700&family=Lalezar&family=Lateef&family=Lato:wght@400;700&family=Lemonada:wght@400;700&family=Lora:wght@400;700&family=Mada:wght@400;700&family=Marhey:wght@400;700&family=Markazi+Text:wght@400;700&family=Merriweather:wght@400;700&family=Mirza:wght@400;700&family=Montserrat:wght@400;700&family=Mukta:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Nunito:wght@400;700&family=Open+Sans:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Prompt:wght@400;700&family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&family=Qahiri&family=Quicksand:wght@400;700&family=Rakkas&family=Raleway:wght@400;700&family=Reem+Kufi:wght@400;700&family=Roboto:wght@400;700&family=Ruwudu:wght@400;700&family=Source+Sans+Pro:wght@400;700&family=Tajawal:wght@400;700&family=Titillium+Web:wght@400;700&family=Ubuntu:wght@400;700&family=Work+Sans:wght@400;700&display=swap';

let loaded = false;

const addSheet = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

export const loadPageFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  addSheet(MAIN);
  addSheet(REST);
};
