import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator } from '@playwright/test'

async function silenceHeadlessFirefox(
  browserName: string,
  audio: Locator,
): Promise<void> {
  if (browserName !== 'firefox' || !process.env.CI) return
  await audio.evaluate((element) => {
    const audioElement = element as HTMLAudioElement
    audioElement.muted = true
  })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/React Audio Native/)
})

test('plays generated audio with keyboard and pointer accessible controls', async ({
  browserName,
  page,
}) => {
  const player = page.getByTestId('main-player').locator('.audio-native')
  await expect(player).toHaveAttribute('data-state', /ready|paused/)
  await expect(
    player.getByRole('slider', { name: 'Audio progress' }),
  ).toBeVisible()
  await expect(
    player.getByRole('link', { name: 'Download audio' }),
  ).toHaveAttribute('href', /neon-room\.wav$/)

  await silenceHeadlessFirefox(browserName, player.locator('audio'))
  await player.getByRole('button', { name: 'Play audio' }).click()
  await expect(player).toHaveAttribute('data-state', 'playing')
  await expect(
    player.getByRole('button', { name: 'Pause audio' }),
  ).toBeVisible()

  const progress = player.getByRole('slider', { name: 'Audio progress' })
  await progress.focus()
  await progress.press('ArrowRight')
  await player.getByRole('button', { name: 'Pause audio' }).press('Space')
  await expect(player).toHaveAttribute('data-state', 'paused')

  await page.getByRole('button', { name: /02.*深夜回放/ }).click()
  await expect(player.getByText('深夜回放')).toBeVisible()
})

test('keeps tabs keyboard operable and supports reduced motion', async ({
  page,
}) => {
  const recommended = page.getByRole('tab', { name: 'Recommended API' })
  await recommended.focus()
  await recommended.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Vue → React' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const reducedMotion = page.getByRole('checkbox', {
    name: /减少动画|Reduce motion/,
  })
  await reducedMotion.focus()
  await reducedMotion.press('Space')
  await expect(reducedMotion).toBeChecked()
  await expect(page.locator('html')).toHaveClass(/reduce-motion/)
})

test('keeps settings focus inside the Sheet or Drawer and restores it on close', async ({
  page,
}, testInfo) => {
  const isMobile =
    testInfo.project.name === 'iphone-13' || testInfo.project.name === 'pixel-7'
  const trigger = isMobile
    ? page.getByRole('button', { name: 'Open demo settings' })
    : page.getByRole('button', { name: '演示设置' })

  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: '演示设置' })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    )
    .toBe(true)

  const nativeControls = dialog.getByRole('switch', {
    name: 'Toggle native controls',
  })
  await dialog.getByRole('button', { name: '恢复演示设置' }).click()
  await expect(page.getByText('演示设置已恢复')).toBeVisible()
  await nativeControls.click()
  await expect(nativeControls).toBeChecked()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(
    page.getByTestId('main-player').locator('audio'),
  ).toHaveAttribute('controls', '')
})

test('coordinates exclusive players in the same group', async ({
  browserName,
  page,
}) => {
  const groupedPlayers = page
    .getByTestId('exclusive-players')
    .locator('.audio-native')
  await expect(groupedPlayers).toHaveCount(2)

  await silenceHeadlessFirefox(
    browserName,
    groupedPlayers.nth(0).locator('audio'),
  )
  await silenceHeadlessFirefox(
    browserName,
    groupedPlayers.nth(1).locator('audio'),
  )
  await groupedPlayers
    .nth(0)
    .getByRole('button', { name: 'Play audio' })
    .click()
  await expect(groupedPlayers.nth(0)).toHaveAttribute('data-state', 'playing')
  await groupedPlayers
    .nth(1)
    .getByRole('button', { name: 'Play audio' })
    .click()
  await expect(groupedPlayers.nth(0)).toHaveAttribute('data-state', 'paused')
  await expect(groupedPlayers.nth(1)).toHaveAttribute('data-state', 'playing')
})

test('has no horizontal overflow or serious accessibility violations', async ({
  page,
}) => {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)

  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking).toEqual([])
})
