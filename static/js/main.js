// Initialize theme on page load based on localStorage or system preferences
(function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

// Initialize Lucide icons and theme icons once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  updateThemeIcons();
});

// Toggle Dark and Light Mode
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

function updateThemeIcons() {
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  
  if (!darkIcon || !lightIcon) return;

  if (document.documentElement.classList.contains('dark')) {
    darkIcon.classList.add('hidden');
    lightIcon.classList.remove('hidden');
  } else {
    lightIcon.classList.add('hidden');
    darkIcon.classList.remove('hidden');
  }
}

// Image preview handler for file selection
function previewImage(input) {
  const placeholder = document.getElementById("upload-placeholder");
  const previewContainer = document.getElementById("image-preview-container");
  const preview = document.getElementById("image-preview");

  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      placeholder.classList.add("hidden");
      previewContainer.classList.remove("hidden");
    };

    reader.readAsDataURL(input.files[0]);
  }
}

// Smooth scroll to top function
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Copy contact email action with feedback
function copyContactEmail(btn) {
  const email = "contact@nutriscan.ai";
  navigator.clipboard.writeText(email).then(() => {
    const copyText = document.getElementById("copy-text");
    const originalText = copyText.innerText;

    copyText.innerText = "Copied!";
    btn.classList.add("border-emerald-500", "text-emerald-500");

    setTimeout(() => {
      copyText.innerText = originalText;
      btn.classList.remove("border-emerald-500", "text-emerald-500");
    }, 2000);
  });
}
const rawFoodList = [
    "adhirasam", "aloo_gobi", "aloo_matar", "aloo_methi", "aloo_shimla_mirch", "aloo_tikki", 
    "anarsa", "ariselu", "bandar_laddu", "basundi", "bhatura", "bhindi_masala", "biryani", 
    "boondi", "butter_chicken", "chak_hao_kheer", "cham_cham", "chana_masala", "chapati", 
    "chhena_kheeri", "chicken_razala", "chicken_tikka", "chicken_tikka_masala", "chikki", 
    "daal_baati_churma", "daal_puri", "dal_makhani", "dal_tadka", "dharwad_pedha", "doodhpak", 
    "double_ka_meetha", "dum_aloo", "gajar_ka_halwa", "gavvalu", "ghevar", "gulab_jamun", 
    "imarti", "jalebi", "kachori", "kadai_paneer", "kadhi_pakoda", "kajjikaya", "kakinada_khaja", 
    "kalakand", "karela_bharta", "kofta", "kuzhi_paniyaram", "lassi", "ledikeni", "litti_chokha", 
    "lyangcha", "maach_jhol", "makki_di_roti_sarson_da_saag", "malapua", "misi_roti", "misti_doi", 
    "modak", "mysore_pak", "naan", "navrattan_korma", "palak_paneer", "paneer_butter_masala", 
    "phirni", "pithe", "poha", "poornalu", "pootharekulu", "qubani_ka_meetha", "rabri", 
    "ras_malai", "rasgulla", "sandesh", "shankarpali", "sheer_korma", "sheera", "shrikhand", 
    "sohan_halwa", "sohan_papdi", "sutar_feni", "unni_appam"
  ];

  // Map keywords for smart categorization
  const sweetsKeywords = ["kheer", "halwa", "laddu", "jamun", "rasgulla", "pedha", "rabri", "doi", "modak", "pak", "jalebi", "imarti", "ghevar", "sandesh", "korma", "sheera", "shrikhand", "chikki", "basundi", "sweet", "meetha", "phirni", "pithe", "malapua", "ledikeni", "lyangcha", "cham_cham", "anarsa", "adhirasam", "ariselu", "boondi", "gavvalu", "kajjikaya", "khaja", "kalakand", "poornalu", "pootharekulu", "sutar_feni"];
  const snacksKeywords = ["tikki", "kachori", "bhatura", "chapati", "naan", "roti", "puri", "poha", "litti", "paniyaram", "appam", "shankarpali", "lassi"];

  let currentCategory = "all";

  function getCategory(slug) {
    if (sweetsKeywords.some(kw => slug.includes(kw))) return "sweets";
    if (snacksKeywords.some(kw => slug.includes(kw))) return "snacks";
    return "mains";
  }

  function formatTitle(slug) {
    return slug.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  // Render food list into grid
  function renderFoodGrid() {
    const grid = document.getElementById("food-grid");
    grid.innerHTML = "";

    let counts = { all: rawFoodList.length, sweets: 0, mains: 0, snacks: 0 };

    rawFoodList.forEach(item => {
      const cat = getCategory(item);
      counts[cat]++;

      const title = formatTitle(item);
      const card = document.createElement("div");
      card.className = `food-item-card p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-default`;
      card.dataset.name = title.toLowerCase();
      card.dataset.category = cat;

      card.innerHTML = `
        <div class="flex items-center gap-2 truncate">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors shrink-0"></div>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">${title}</span>
        </div>
        <span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 shrink-0 font-mono">${cat === 'mains' ? 'Main' : cat}</span>
      `;
      grid.appendChild(card);
    });

    // Update filter counts
    document.getElementById("cnt-all").innerText = counts.all;
    document.getElementById("cnt-sweets").innerText = counts.sweets;
    document.getElementById("cnt-mains").innerText = counts.mains;
    document.getElementById("cnt-snacks").innerText = counts.snacks;

    if (window.lucide) { lucide.createIcons(); }
  }

  // Filter functionality
  function filterFoods() {
    const query = document.getElementById("food-search-input").value.toLowerCase();
    const cards = document.querySelectorAll(".food-item-card");
    let visibleCount = 0;

    cards.forEach(card => {
      const matchesSearch = card.dataset.name.includes(query);
      const matchesCategory = currentCategory === "all" || card.dataset.category === currentCategory;

      if (matchesSearch && matchesCategory) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        card.classList.add("hidden");
      }
    });

    document.getElementById("food-count").innerText = visibleCount;
    document.getElementById("no-foods-found").classList.toggle("hidden", visibleCount > 0);
  }

  function setCategoryFilter(category) {
    currentCategory = category;
    
    // Reset active button UI
    document.querySelectorAll(".cat-filter-btn").forEach(btn => {
      btn.className = "cat-filter-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
    });

    // Highlight active button
    const activeBtn = document.getElementById(`btn-cat-${category}`);
    activeBtn.className = "cat-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-emerald-500 text-slate-950 shadow-sm";

    filterFoods();
  }

  // Initialize on DOM Load
  document.addEventListener("DOMContentLoaded", () => {
    renderFoodGrid();
  });
    function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function copyContactEmail(btn) {
    const email = "fatimahmobeen47@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      const copyTextSpan = document.getElementById("copy-text");
      const originalText = copyTextSpan.innerText;
      
      copyTextSpan.innerText = "Email Copied!";
      btn.classList.add("bg-emerald-500/20", "border-emerald-500/50", "text-emerald-500");

      setTimeout(() => {
        copyTextSpan.innerText = originalText;
        btn.classList.remove("bg-emerald-500/20", "border-emerald-500/50", "text-emerald-500");
      }, 2000);
    });
  }

  // Set Year Dynamically
  document.addEventListener("DOMContentLoaded", () => {
    const yr = document.getElementById("current-year");
    if (yr) yr.innerText = new Date().getFullYear();
    if (window.lucide) lucide.createIcons();
  });