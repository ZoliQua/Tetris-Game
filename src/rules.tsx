import {
  formatNumber,
  TouchHelp,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  type RulesSection,
} from './arcade';
import { MESSAGES } from './i18n';
import {
  ALL_KINDS,
  HARD_DROP_POINTS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  LOCK_RESET_CAP,
  POINTS_PER_LINES,
  SOFT_DROP_POINTS,
} from './logic/constants';
import { LineClearDiagram } from './components/LineClearDiagram';

/** [gesture, action] rows for `TouchHelp` and the Rules → mobile section. */
export function useTouchRows(): [string, string][] {
  const t = useMessages(MESSAGES);
  return [
    [t('touchTap'), t('touchDoRotate')],
    [t('touchDrag'), t('touchDoMove')],
    [t('touchSwipeDown'), t('touchDoSoft')],
    [t('touchFlick'), t('touchDoHard')],
    [t('touchHoldPanel'), t('touchDoHold')],
    ['◀ ▶ ⟳ ▼ ⤓', t('touchDoPad')],
  ];
}

const isIos = () => typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);

/** The Tetris rules for the kit `RulesButton`, in the active language. */
export function useRulesSections(): RulesSection[] {
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const touchRows = useTouchRows();
  const points = (n: number) => ({ points: formatNumber(n, lang) });

  return [
    {
      id: 'goal',
      body: (
        <>
          <p>{t('rulesGoalText')}</p>
          <LineClearDiagram />
        </>
      ),
    },
    { id: 'play', body: <p>{touch ? t('rulesPlayTouch') : t('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <ul>
          <li>{t('rulesBag', { n: formatNumber(ALL_KINDS.length, lang) })}</li>
          <li>{t('rulesGhost')}</li>
          <li>{t('rulesHold')}</li>
          <li>
            {t('rulesLock', {
              seconds: formatNumber(LOCK_DELAY_MS / 1000, lang),
              cap: formatNumber(LOCK_RESET_CAP, lang),
            })}
          </li>
          <li>{t('rulesEnd')}</li>
        </ul>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>{t('rulesScoringIntro')}</p>
          <ul>
            <li>{t('rulesSingle', points(POINTS_PER_LINES[1]))}</li>
            <li>{t('rulesDouble', points(POINTS_PER_LINES[2]))}</li>
            <li>{t('rulesTriple', points(POINTS_PER_LINES[3]))}</li>
            <li>{t('rulesTetris', points(POINTS_PER_LINES[4]))}</li>
            <li>{t('rulesSoft', points(SOFT_DROP_POINTS))}</li>
            <li>{t('rulesHard', points(HARD_DROP_POINTS))}</li>
          </ul>
          <p>{t('rulesLevelUp', { lines: formatNumber(LINES_PER_LEVEL, lang) })}</p>
        </>
      ),
    },
    { id: 'dental', body: <p>{t('rulesDentalText')}</p> },
    {
      id: 'mobile',
      body: (
        <>
          <p>{t('rulesMobileIntro')}</p>
          <TouchHelp rows={touchRows} />
          <p>
            <strong>{k('fullscreen')}</strong>: {t('rulesMobileFullscreen')}
          </p>
          {isIos() && <p>{k('iosHomeScreenTip')}</p>}
        </>
      ),
    },
  ];
}
