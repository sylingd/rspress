import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'basic');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Hello World');
    // expect the .header-anchor to be rendered and take the correct href
    const headerAnchor = await page.$('.header-anchor');
    const href = await page.evaluate(
      headerAnchor => headerAnchor?.getAttribute('href'),
      headerAnchor,
    );
    expect(href).toBe('#hello-world');
  });

  test('Guide page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide`, {
      waitUntil: 'networkidle',
    });
    const h1 = await page.$('h1');
    const className = await page.evaluate(h1 => h1?.className, h1)
    expect(className).toContain('title_e0087') // hash in css module should stable
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    expect(text).toContain('Guide');
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: 'networkidle',
    });
    // find the 404 text in the page
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('404');
  });

  test('dark mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const darkModeButton = await page.$('.rspress-nav-appearance');
    const html = await page.$('html');
    let htmlClass = await page.evaluate(
      html => html?.getAttribute('class'),
      html,
    );
    const defaultMode = htmlClass?.includes('dark') ? 'dark' : 'light';
    await darkModeButton?.click();
    // check the class in html
    htmlClass = await page.evaluate(html => html?.getAttribute('class'), html);
    expect(htmlClass?.includes('dark') ? true : false).toBe(
      defaultMode !== 'dark',
    );
    // click the button again, check the class in html
    await darkModeButton?.click();
    htmlClass = await page.evaluate(html => html?.getAttribute('class'), html);
    expect(htmlClass?.includes('dark') ? true : false).toBe(
      defaultMode === 'dark',
    );
  });
});
