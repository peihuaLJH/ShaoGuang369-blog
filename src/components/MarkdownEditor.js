import React, { useEffect, useRef } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

const MarkdownEditor = ({ value, onChange, height = 480 }) => {
  const editorRef = useRef(null);
  const vditorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // 延迟初始化以确保DOM完全渲染
    const timer = setTimeout(() => {
      try {
        vditorRef.current = new Vditor(editorRef.current, {
          value: value || '',
          mode: 'ir',
          height,
          outline: {
            enable: true,
            position: 'right',
          },
          theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'classic',
          lang: 'zh_CN',
          toolbar: [
            'emoji', 'headings', 'bold', 'italic', 'strike', 'list', 'ordered-list', 'check', 'quote',
            'line', 'code', 'inline-code', 'insert-after', 'insert-before', 'link', 'table',
            'upload', 'record', 'table', 'undo', 'redo', 'edit-mode', 'fullscreen'
          ],
          cache: {
            enable: false,
          },
          counter: {
            enable: true,
          },
          placeholder: '请输入文章内容（Markdown 支持）',
          input: (markdown) => {
            if (onChange) onChange(markdown);
          },
          upload: {
            url: '/api/media/upload',
            format: (file) => {
              return {
                name: 'file',
                filename: file.name,
              };
            },
            success(res) {
              return res.url || '';
            },
          },
        });
      } catch (error) {
        console.error('Vditor initialization failed:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (vditorRef.current) {
        try {
          vditorRef.current.destroy();
        } catch (error) {
          console.error('Vditor destroy failed:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (vditorRef.current && value !== vditorRef.current.getValue()) {
      try {
        vditorRef.current.setValue(value || '');
      } catch (error) {
        console.error('Vditor setValue failed:', error);
      }
    }
  }, [value]);

  return (
    <div className="markdown-editor-wrapper">
      <div ref={editorRef}></div>
    </div>
  );
};

export default MarkdownEditor;
