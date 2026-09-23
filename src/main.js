import { siteConfig } from './config/site.js';
import { bootDesktop } from './desktop/bootstrap.js';

try {
  const response = await fetch(new URL('catalog/projects.json', document.baseURI), { cache: 'no-store' });
  if (!response.ok) throw new Error(`目录加载失败 (${response.status})`);
  bootDesktop({ ...siteConfig, works: await response.json() });
} catch (error) {
  const message = document.createElement('p');
  message.className = 'startup-error';
  message.textContent = `桌面未能启动：${error.message}。请刷新页面重试。`;
  document.querySelector('#desktop').append(message);
  console.error(error);
}
