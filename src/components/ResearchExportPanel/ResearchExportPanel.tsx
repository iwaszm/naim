import { Download } from 'lucide-react';

export function ResearchExportPanel() {
  return (
    <section className="panel export-panel optional">
      <div className="panel-title">
        <Download size={18} />
        <span>Optional data export</span>
      </div>
      <p>CSV/JSON 导出是可选研究增强模块；MVP 不依赖它。</p>
      <button className="ghost-button" disabled>Export module placeholder</button>
    </section>
  );
}
