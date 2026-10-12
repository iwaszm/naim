import { useEffect, useRef, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { SIGNAL_SCHEMA_VERSION, toDisplaySnapshot } from '../../domain/signals/contracts';
import { clearRecords, readRecords, saveRecord, type ResearchRecord } from '../../platform/storage/researchDb';
import { useDashboardStore } from '../../store/useDashboardStore';

function download(name: string, type: string, data: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResearchExportPanel() {
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const sessionId = useRef('');
  const lastFrame = useRef(-1);
  const writing = useRef(Promise.resolve());

  useEffect(() => {
    if (!recording) return;
    return useDashboardStore.subscribe((state) => {
      const frame = state.latestFrame;
      if (!frame || frame.frameIndex === lastFrame.current) return;
      lastFrame.current = frame.frameIndex;
      const record: ResearchRecord = {
        sessionId: sessionId.current,
        kind: 'frame',
        recordedAt: new Date().toISOString(),
        schemaVersion: SIGNAL_SCHEMA_VERSION,
        frame: toDisplaySnapshot(frame),
      };
      writing.current = writing.current.then(() => saveRecord(record)).then(() => setCount((value) => value + 1)).catch((cause) => {
        setRecording(false);
        setError(cause instanceof Error ? cause.message : String(cause));
      });
    });
  }, [recording]);

  const start = () => {
    if (!consent) return;
    sessionId.current = crypto.randomUUID();
    lastFrame.current = -1;
    setCount(0);
    setError('');
    setRecording(true);
  };

  const marker = () => {
    const label = window.prompt('事件标记名称');
    if (!label?.trim()) return;
    writing.current = writing.current.then(() => saveRecord({
      sessionId: sessionId.current,
      kind: 'marker',
      recordedAt: new Date().toISOString(),
      schemaVersion: SIGNAL_SCHEMA_VERSION,
      label: label.trim(),
    })).catch((cause) => setError(String(cause)));
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      await writing.current;
      const records = await readRecords();
      if (!records.length) { setError('没有可导出的记录。'); return; }
      if (format === 'json') {
        download('naim-research.json', 'application/json', JSON.stringify(records, null, 2));
        return;
      }
      const headers = ['sessionId', 'kind', 'recordedAt', 'schemaVersion', 'frameIndex', 'timestamp', 'expressionModelId', 'appraisalModelId', 'label', 'auProxy', 'expressionScores', 'appraisalProxy'];
      const rows = records.map((record) => {
        const frame = record.frame;
        const fields = [record.sessionId, record.kind, record.recordedAt, record.schemaVersion, frame?.frameIndex, frame?.timestamp, frame?.expressionModelId, frame?.appraisalModelId, record.label ?? '', JSON.stringify(frame?.auProxy ?? {}), JSON.stringify(frame?.expressionScores ?? {}), JSON.stringify(frame?.appraisalProxy ?? {})];
        return fields.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',');
      });
      download('naim-research.csv', 'text/csv;charset=utf-8', `\uFEFF${headers.join(',')}\n${rows.join('\n')}`);
    } catch (cause) { setError(String(cause)); }
  };

  const clear = async () => {
    setRecording(false);
    try { await writing.current; await clearRecords(); setCount(0); setError(''); }
    catch (cause) { setError(String(cause)); }
  };

  return (
    <section className="panel export-panel">
      <div className="panel-title"><Download size={18} /><span>本地研究记录</span></div>
      <p>仅记录降频后的数值快照与事件标记，不保存摄像头画面。数据留在此浏览器，可随时导出或清除。</p>
      <label className="record-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={recording} /> 我同意在此设备保存本次研究数值</label>
      <div className="record-actions">
        <button className="primary-button" type="button" disabled={!consent} onClick={() => recording ? setRecording(false) : start()}>{recording ? '停止记录' : '开始记录'}</button>
        <button className="ghost-button active" type="button" disabled={!recording} onClick={marker}>添加标记</button>
        <button className="ghost-button active" type="button" onClick={() => void exportData('json')}>JSON</button>
        <button className="ghost-button active" type="button" onClick={() => void exportData('csv')}>CSV</button>
        <button className="ghost-button active" type="button" onClick={() => void clear()}><Trash2 size={15} />清除全部</button>
      </div>
      <p className="hint">本次已写入 {count} 个快照。更换浏览器或清除站点数据后，本地记录无法恢复。</p>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </section>
  );
}
