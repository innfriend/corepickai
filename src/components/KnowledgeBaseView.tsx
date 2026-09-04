import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Share2, 
  Bookmark, 
  Check, 
  Copy,
  Zap,
  TrendingUp,
  FileText,
  Sliders
} from 'lucide-react';
import { KNOWLEDGE_BASE_ARTICLES, KnowledgeArticle } from '../data/knowledgeBaseData';

interface KnowledgeBaseViewProps {
  onNavigate: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onNavigate, onOpenWizardWithModel }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([]);

  // Categories list
  const categories = ['All', 'Quantization & Precision', 'Hardware Architecture', 'Runtime & Engines', 'Kernel Optimization', 'Serving & Cost'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_BASE_ARTICLES.filter((article) => {
      const matchesSearch = 
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        article.hardwareTags.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || article.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const activeArticle: KnowledgeArticle | undefined = useMemo(() => {
    if (!activeArticleSlug) return undefined;
    return KNOWLEDGE_BASE_ARTICLES.find(a => a.slug === activeArticleSlug);
  }, [activeArticleSlug]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedArticles.includes(id)) {
      setBookmarkedArticles(bookmarkedArticles.filter(x => x !== id));
    } else {
      setBookmarkedArticles([...bookmarkedArticles, id]);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto" id="knowledge-base-root">
      {/* Detail Article View */}
      {activeArticle ? (
        <article className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8" itemScope itemType="https://schema.org/TechArticle">
          {/* Breadcrumb Nav */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <button 
              onClick={() => setActiveArticleSlug(null)}
              className="hover:text-cyan-400 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Base</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-400">{activeArticle.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
            <span className="text-slate-300 truncate max-w-xs hidden sm:inline">{activeArticle.title}</span>
          </nav>

          {/* Article Header Card */}
          <header className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
                  {activeArticle.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  activeArticle.difficulty === 'Advanced' 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : activeArticle.difficulty === 'Expert'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {activeArticle.difficulty}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeArticle.readingTimeMin} min read</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-[#27354F] transition-colors cursor-pointer"
                  title="Share article URL"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>
                <button
                  onClick={(e) => toggleBookmark(activeArticle.id, e)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    bookmarkedArticles.includes(activeArticle.id)
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white border-[#27354F]'
                  }`}
                  title="Bookmark article"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight leading-tight" itemProp="headline">
              {activeArticle.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans" itemProp="description">
              {activeArticle.summary}
            </p>

            {/* Author Meta */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E293B] text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {activeArticle.author.avatarInitials}
                </div>
                <div>
                  <span className="font-bold text-white block" itemProp="author">{activeArticle.author.name}</span>
                  <span className="text-slate-400 text-[10px]">{activeArticle.author.role}</span>
                </div>
              </div>
              <time className="text-slate-400 text-xs" itemProp="dateModified" dateTime={activeArticle.lastUpdated}>
                Updated: {activeArticle.lastUpdated}
              </time>
            </div>
          </header>

          {/* Key Engineering Takeaways Box */}
          <section className="bg-gradient-to-br from-cyan-950/40 via-[#0D1322] to-emerald-950/30 border border-cyan-800/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold font-mono text-cyan-300 uppercase tracking-wide">
                Key Engineering Insights
              </h2>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm font-sans text-slate-200">
              {activeArticle.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Silicon & Framework Chips */}
          <div className="flex flex-wrap items-center gap-3 bg-[#0D1322] border border-[#1E293B] rounded-2xl p-4">
            <span className="text-xs font-mono text-slate-400 font-bold">Target Silicon:</span>
            {activeArticle.hardwareTags.map((hw, idx) => (
              <span key={idx} className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-[#131B2E] text-cyan-300 rounded-lg border border-[#27354F]">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>{hw}</span>
              </span>
            ))}
            <span className="text-xs font-mono text-slate-400 font-bold ml-2">Runtimes:</span>
            {activeArticle.runtimeTags.map((rt, idx) => (
              <span key={idx} className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-[#131B2E] text-emerald-300 rounded-lg border border-[#27354F]">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>{rt}</span>
              </span>
            ))}
          </div>

          {/* Main Article Body */}
          <main className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-10 space-y-6 text-slate-200 font-sans leading-relaxed text-sm sm:text-base">
            <div className="prose prose-invert max-w-none space-y-6">
              {activeArticle.contentMarkdown.split('\n\n').map((block, idx) => {
                if (block.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xl sm:text-2xl font-bold font-mono text-white pt-4 pb-1 border-b border-[#1E293B] flex items-center gap-2">
                      <span className="text-cyan-400 font-mono text-sm">§</span>
                      <span>{block.replace('### ', '')}</span>
                    </h3>
                  );
                }
                if (block.startsWith('#### ')) {
                  return (
                    <h4 key={idx} className="text-base sm:text-lg font-bold font-mono text-cyan-300 pt-2">
                      {block.replace('#### ', '')}
                    </h4>
                  );
                }
                if (block.startsWith('```')) {
                  const cleanedCode = block.replace(/```[a-z]*\n?/g, '');
                  return (
                    <pre key={idx} className="bg-[#07090E] border border-[#1E293B] p-4 rounded-2xl overflow-x-auto text-xs sm:text-sm font-mono text-cyan-300 leading-relaxed shadow-inner">
                      <code>{cleanedCode}</code>
                    </pre>
                  );
                }
                if (block.startsWith('|')) {
                  const rows = block.trim().split('\n');
                  const headerCells = rows[0].split('|').filter(c => c.trim().length > 0);
                  const dataRows = rows.slice(2);
                  return (
                    <div key={idx} className="overflow-x-auto my-4 border border-[#1E293B] rounded-2xl bg-[#07090E]">
                      <table className="w-full text-xs font-mono text-left">
                        <thead className="bg-[#131B2E] border-b border-[#1E293B] text-cyan-300">
                          <tr>
                            {headerCells.map((h, hIdx) => (
                              <th key={hIdx} className="p-3 font-bold">{h.trim()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B]">
                          {dataRows.map((r, rIdx) => {
                            const cells = r.split('|').filter(c => c.trim().length > 0);
                            return (
                              <tr key={rIdx} className="hover:bg-[#131B2E]/50 transition-colors">
                                {cells.map((c, cIdx) => (
                                  <td key={cIdx} className="p-3 text-slate-300">{c.trim()}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed text-slate-300 font-sans text-sm sm:text-base">
                    {block}
                  </p>
                );
              })}
            </div>
          </main>

          {/* FAQ Accordion Section for Rich Snippets & Search intent */}
          {activeArticle.faq && activeArticle.faq.length > 0 && (
            <section className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-5" itemScope itemType="https://schema.org/FAQPage">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold font-mono text-white">
                  Frequently Asked Questions (FAQ)
                </h2>
              </div>

              <div className="space-y-4">
                {activeArticle.faq.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-5 space-y-2"
                    itemScope 
                    itemProp="mainEntity" 
                    itemType="https://schema.org/Question"
                  >
                    <h3 className="text-sm sm:text-base font-bold font-mono text-cyan-300" itemProp="name">
                      {item.question}
                    </h3>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed" itemProp="text">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Interactive Call to Action to Launch Profiler on related topic */}
          <footer className="bg-gradient-to-r from-cyan-950 via-[#0D1322] to-indigo-950 border border-cyan-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold font-mono text-white">Ready to benchmark this technique on your neural graphs?</h4>
              <p className="text-xs text-slate-400">Launch CorePick's Automated Profiler Wizard to simulate speedups and export serialized engines.</p>
            </div>
            <button
              onClick={() => onNavigate('app-analyze')}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-black text-xs font-mono rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Profiler Wizard</span>
            </button>
          </footer>
        </article>
      ) : (
        /* Knowledge Base Overview & Search Catalog */
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Hero */}
          <header className="bg-gradient-to-br from-[#0D1322] via-[#0A0E1A] to-[#131B2E] border border-[#1E293B] rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800/60">
                  Engineering Knowledge Hub
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Peer-Reviewed ML & HPC Guides</span>
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight leading-tight">
                AI Inference Optimization & Silicon Knowledge Base
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                Deep architectural guides, operator fusion patterns, low-precision quantization benchmarks (AWQ/GPTQ/FP8), and cost economics across NVIDIA, AMD, Qualcomm, and Apple hardware.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative z-10 max-w-2xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by keyword, GPU (H100, RTX 4090), quantization (AWQ, INT8), or kernel pattern..."
                  className="w-full bg-[#07090E]/90 border border-[#27354F] focus:border-cyan-400 text-white rounded-2xl pl-12 pr-4 py-3.5 text-xs sm:text-sm font-mono focus:outline-none transition-all placeholder:text-slate-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                      : 'bg-[#131B2E] text-slate-300 hover:text-white border border-[#27354F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </header>

          {/* Quick Technical Quicklinks / Topic Highlights */}
          <section aria-label="Topic Highlights" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'INT4 & FP8 Precision',
                desc: 'AWQ vs GPTQ vs Transformer Engine',
                icon: Sliders,
                tag: 'Quantization',
                action: () => setSelectedCategory('Quantization & Precision')
              },
              {
                title: 'Roofline Diagnostics',
                desc: 'Operational Intensity & Memory Ceilings',
                icon: TrendingUp,
                tag: 'Kernel Tuning',
                action: () => setSelectedCategory('Kernel Optimization')
              },
              {
                title: 'PagedAttention & KV-Cache',
                desc: 'Virtual memory pagination & prefix caching',
                icon: Layers,
                tag: 'Serving Tech',
                action: () => setSelectedCategory('Serving & Cost')
              },
              {
                title: 'Silicon TCO Playbook',
                desc: 'Cloud GPUs vs Reserved vs On-Premise',
                icon: Cpu,
                tag: 'Cost FinOps',
                action: () => setSelectedCategory('Serving & Cost')
              }
            ].map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <div 
                  key={idx}
                  onClick={topic.action}
                  className="bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 rounded-2xl p-5 space-y-3 cursor-pointer transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800/60 group-hover:bg-cyan-500 group-hover:text-[#07090E] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{topic.tag}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{topic.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Articles Grid */}
          <section aria-label="Articles Directory" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Featured Technical Guides ({filteredArticles.length})</span>
              </h2>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Filter Difficulty:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-[#131B2E] border border-[#27354F] rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {difficulties.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold font-mono text-white">No matching guides found</h3>
                <p className="text-xs text-slate-400">Try adjusting your keyword search or category filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedDifficulty('All'); }}
                  className="px-4 py-2 bg-cyan-500 text-[#07090E] text-xs font-bold font-mono rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => setActiveArticleSlug(article.slug)}
                    className="bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-cyan-950/80 text-cyan-300 rounded border border-cyan-800/60">
                          {article.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            article.difficulty === 'Advanced' 
                              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                              : article.difficulty === 'Expert'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {article.difficulty}
                          </span>
                          <button
                            onClick={(e) => toggleBookmark(article.id, e)}
                            className={`p-1 rounded transition-colors ${
                              bookmarkedArticles.includes(article.id) ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold font-mono text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#1E293B]">
                      {/* Keyword tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {article.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-[#131B2E] text-slate-400 rounded">
                            #{kw}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{article.readingTimeMin} min read</span>
                        </span>

                        <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Read Guide</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
