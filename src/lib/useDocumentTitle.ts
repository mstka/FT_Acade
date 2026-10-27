import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | FT_Arcade` : 'FT_Arcade';
  }, [title]);
}
