(function() {
  const SUPABASE_URL = 'https://ipkebpyuvailfrujwkwk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa2VicHl1dmFpbGZydWp3a3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1OTYwMDUsImV4cCI6MjA4MzE3MjAwNX0.UsgJIS_CsZkXSihV7XG8nn2HEgkH-JAspw5s8IuWSBI';

  let supabase = null;

  function initSupabase() {
    if (window.supabase && !supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return !!supabase;
  }

  async function waitForSupabase(retries = 20, delay = 200) {
      if (window.supabase) return true;
      for (let i = 0; i < retries; i++) {
          await new Promise(r => setTimeout(r, delay));
          if (window.supabase) return true;
      }
      return false;
  }

  function redirectToCheckout(url) {
    const next = (window.TTTrack && typeof window.TTTrack.withTikTokParams === "function")
      ? window.TTTrack.withTikTokParams(url)
      : url;
    window.location.href = next;
  }

  window.handleCheckout = async function(pageSlug, fallbackUrl, buttonElement) {
    const ready = await waitForSupabase();
    if (ready) initSupabase();

    if (buttonElement) {
      buttonElement.textContent = buttonElement.getAttribute("data-loading-text") || "Processing...";
      buttonElement.style.opacity = "0.7";
      buttonElement.disabled = true;
    }

    if (!supabase) {
      console.error('Supabase client not initialized. Using fallback.');
      redirectToCheckout(fallbackUrl);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('page_checkout_links')
        .select('checkout_url, product_price')
        .eq('page_slug', pageSlug)
        .single();

      if (error) {
        console.log('Error or no link found:', error);
        redirectToCheckout(fallbackUrl);
        return;
      }

      if (data && data.checkout_url) {
        redirectToCheckout(data.checkout_url);
      } else {
        redirectToCheckout(fallbackUrl);
      }
    } catch (err) {
      console.error('Unexpected error fetching checkout link:', err);
      redirectToCheckout(fallbackUrl);
    }
  };

  window.updateProductPrice = async function(pageSlug) {
    const ready = await waitForSupabase();
    if (!ready) {
        console.error('Supabase SDK not loaded.');
        return;
    }
    
    initSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('page_checkout_links')
        .select('product_price')
        .eq('page_slug', pageSlug)
        .single();

      if (data && data.product_price) {
        const newPrice = data.product_price;
        console.log('Updating price to:', newPrice);
        
        const updateElements = () => {
            const elements = document.querySelectorAll('.js-dynamic-product-price');
            elements.forEach(el => {
              el.textContent = newPrice;
            });
        };

        updateElements();

        // Retry mechanism for dynamic content or slow rendering
        setTimeout(updateElements, 500);
        setTimeout(updateElements, 2000);
      }
    } catch (err) {
      console.error('Error updating product price:', err);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
      // Try to detect slug from inline script
      const scripts = document.querySelectorAll('script');
      let foundSlug = null;
      
      for (let script of scripts) {
          if (script.textContent.includes('window.handleCheckout')) {
              const match = script.textContent.match(/window\.handleCheckout\(['"]([^'"]+)['"]/);
              if (match && match[1]) {
                  foundSlug = match[1];
                  break;
              }
          }
      }

      if (foundSlug) {
          console.log('Detected slug for price update:', foundSlug);
          window.updateProductPrice(foundSlug);
      } else {
          // Fallback: check meta tag if exists (added in previous version but maybe removed/not used)
          const metaSlug = document.querySelector('meta[name="page-slug"]');
          if (metaSlug) {
              window.updateProductPrice(metaSlug.getAttribute('content'));
          }
      }
  });
})();
