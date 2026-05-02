import { FunctionComponent, ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Flex, H4, Small, Text } from '@bigcommerce/big-design';
import { theme } from '@bigcommerce/big-design-theme';
import { ArrowBackIcon, ChevronLeftIcon, ChevronRightIcon, OpenInNewIcon, SettingsIcon } from '@bigcommerce/big-design-icons';
import styled from 'styled-components';
import registry from '../generated/traceability.json';

/**
 * Trace ID — opaque identifier that points at a spec anchor. The traceability
 * registry resolves these to doc URLs. Recognized patterns are project-defined
 * (e.g. "US-1.2" → BRD user story, "D1" → decision, "ARCH:3" → architecture
 * section). The registry ships empty in the template — populate it from your
 * project's spec docs when you wire traceability up.
 */
export type TraceId = string;

export interface SlicePage {
  name: string;
  route: string;
  /** Primary spec story this page demonstrates (shorthand; also written into traces). */
  story?: string;
  /** Additional spec references this page demonstrates. */
  traces?: TraceId[];
}

export interface SliceConfig {
  name: string;
  description?: string;
  brdRef?: string;
  phase?: 'MVP' | 'P2' | 'P3';
  pages: SlicePage[];
  flows?: { name: string; steps: string[] }[];
  /** Spec references that apply to the whole slice (rendered on every page). */
  traces?: TraceId[];
}

interface SliceShellProps {
  config: SliceConfig;
  sliceName: string;
  currentPageName: string;
  tools?: ReactNode;
  notes?: ReactNode;
  children: ReactNode;
}

const SHELL_BG = '#f5f7fa';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${SHELL_BG};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.small} ${theme.spacing.large};
  background: ${theme.colors.white};
  border-bottom: 1px solid ${theme.colors.secondary20};
  flex-shrink: 0;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.medium};
`;

const StudioLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xxSmall};
  color: ${theme.colors.secondary70};
  text-decoration: none;
  font-size: 14px;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ToolsToggle = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xxSmall};
  padding: ${theme.spacing.xSmall} ${theme.spacing.small};
  background: ${(p) => (p.$open ? theme.colors.primary10 : 'transparent')};
  color: ${(p) => (p.$open ? theme.colors.primary : theme.colors.secondary70)};
  border: 1px solid ${(p) => (p.$open ? theme.colors.primary30 : theme.colors.secondary30)};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: ${theme.colors.primary10};
    color: ${theme.colors.primary};
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.nav`
  width: 260px;
  flex-shrink: 0;
  background: ${theme.colors.white};
  border-right: 1px solid ${theme.colors.secondary20};
  overflow-y: auto;
  padding: ${theme.spacing.large} 0;
`;

const SidebarSection = styled.div`
  padding: 0 ${theme.spacing.large} ${theme.spacing.medium} ${theme.spacing.large};
`;

const PageList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const PageLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.small};
  padding: ${theme.spacing.small} ${theme.spacing.large};
  text-decoration: none;
  color: ${(p) => (p.$active ? theme.colors.primary : theme.colors.secondary70)};
  background: ${(p) => (p.$active ? theme.colors.primary10 : 'transparent')};
  border-left: 3px solid
    ${(p) => (p.$active ? theme.colors.primary : 'transparent')};

  &:hover {
    background: ${theme.colors.secondary10};
    color: ${(p) => (p.$active ? theme.colors.primary : theme.colors.secondary70)};
  }
`;

const StepCircle = styled.span<{ $active: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => (p.$active ? theme.colors.primary : theme.colors.secondary20)};
  color: ${(p) => (p.$active ? theme.colors.white : theme.colors.secondary70)};
  flex-shrink: 0;
`;

const Main = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ContentScroll = styled.div`
  flex: 1;
  padding: ${theme.spacing.large};
`;

const TraceChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.xSmall};
  padding: ${theme.spacing.small} ${theme.spacing.large};
  background: ${theme.colors.primary10};
  border-bottom: 1px solid ${theme.colors.primary20};
  flex-shrink: 0;
  font-size: 12px;
`;

const TraceChip = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.primary30};
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.primary};
  text-decoration: none;
  transition: background 0.1s;

  &:hover {
    background: ${theme.colors.primary20};
    text-decoration: none;
  }
`;

const TraceChipMissing = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: ${theme.colors.secondary10};
  border: 1px dashed ${theme.colors.secondary30};
  border-radius: 999px;
  font-size: 11px;
  color: ${theme.colors.secondary70};
`;

const PrevNextBar = styled.div`
  display: flex;
  align-items: stretch;
  border-top: 1px solid ${theme.colors.secondary20};
  background: ${theme.colors.white};
  flex-shrink: 0;
`;

const PrevNextButton = styled.button<{ $disabled?: boolean; $align: 'left' | 'right' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$align === 'left' ? 'flex-start' : 'flex-end')};
  gap: ${theme.spacing.small};
  padding: ${theme.spacing.medium} ${theme.spacing.large};
  background: transparent;
  border: none;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.4 : 1)};
  color: ${theme.colors.secondary70};
  text-align: ${(p) => p.$align};

  &:hover:not(:disabled) {
    background: ${theme.colors.primary10};
    color: ${theme.colors.primary};
  }
`;

const PrevNextDivider = styled.div`
  width: 1px;
  background: ${theme.colors.secondary20};
`;

const ToolsDrawer = styled.aside<{ $open: boolean }>`
  width: ${(p) => (p.$open ? '400px' : '0')};
  flex-shrink: 0;
  background: ${theme.colors.warning10};
  border-left: ${(p) => (p.$open ? `1px solid ${theme.colors.warning30}` : 'none')};
  overflow: hidden;
  transition: width 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
`;

const ToolsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.medium} ${theme.spacing.large};
  background: ${theme.colors.warning20};
  border-bottom: 1px solid ${theme.colors.warning30};
  flex-shrink: 0;
`;

const ToolsBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.large};
  width: 400px;
  box-sizing: border-box;
  word-wrap: break-word;
`;

const ToolsSection = styled.div`
  margin-bottom: ${theme.spacing.large};

  &:last-child {
    margin-bottom: 0;
  }
`;

const ToolsSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${theme.colors.secondary70};
  margin-bottom: ${theme.spacing.small};
`;

function buildHref(sliceName: string, route: string): string {
  const base = `/prototypes/${sliceName}`;
  if (route === '/' || route === '') return `${base}/`;
  return `${base}${route.startsWith('/') ? route : '/' + route}`;
}

type TraceEntry = { id: string; label: string; docUrl: string; kind: string };
const traceById = new Map<string, TraceEntry>(
  (registry.entries as TraceEntry[] | undefined)?.map((e) => [e.id, e]) ?? [],
);

function resolveTraces(ids: TraceId[]): { resolved: TraceEntry[]; missing: string[] } {
  const resolved: TraceEntry[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = traceById.get(id);
    if (entry) resolved.push(entry);
    else missing.push(id);
  }
  return { resolved, missing };
}

export const SliceShell: FunctionComponent<SliceShellProps> = ({
  config,
  sliceName,
  currentPageName,
  tools,
  notes,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);

  const currentIndex = useMemo(
    () => config.pages.findIndex((p) => p.name === currentPageName),
    [config.pages, currentPageName],
  );

  const prevPage = currentIndex > 0 ? config.pages[currentIndex - 1] : null;
  const nextPage =
    currentIndex >= 0 && currentIndex < config.pages.length - 1
      ? config.pages[currentIndex + 1]
      : null;

  const hasTools = !!tools || !!notes;

  // Merge slice-level + current-page traces, de-duped. `story` shorthand counts.
  const currentPage = currentIndex >= 0 ? config.pages[currentIndex] : null;
  const traceIds: TraceId[] = [
    ...(config.traces ?? []),
    ...(currentPage?.traces ?? []),
    ...(currentPage?.story ? [currentPage.story] : []),
  ];
  const { resolved: traces, missing: missingTraces } = resolveTraces(traceIds);

  // Clean mode: ?clean=1 strips all prototype harness so the product canvas
  // renders as it would in production. Useful for screenshots and previews
  // shared with non-prototype audiences.
  const isClean = new URLSearchParams(location.search).get('clean') === '1';
  if (isClean) {
    return (
      <Box style={{ minHeight: '100vh', background: SHELL_BG, padding: theme.spacing.large }}>
        {children}
      </Box>
    );
  }

  return (
    <Layout>
      <TopBar>
        <TopBarLeft>
          <StudioLink to="/">
            <ArrowBackIcon size="small" />
            <span>Studio</span>
          </StudioLink>
          <Box style={{ height: 16, width: 1, background: theme.colors.secondary30 }} />
          <Box>
            <Text bold marginBottom="none">{config.name}</Text>
            {config.brdRef && (
              <Small color="secondary60">{config.brdRef}</Small>
            )}
          </Box>
          {config.phase && (
            <Badge
              label={config.phase}
              variant={config.phase === 'MVP' ? 'success' : config.phase === 'P2' ? 'warning' : 'secondary'}
            />
          )}
        </TopBarLeft>
        {hasTools && (
          <ToolsToggle $open={toolsOpen} onClick={() => setToolsOpen(!toolsOpen)}>
            <SettingsIcon size="small" />
            <span>Prototype tools</span>
          </ToolsToggle>
        )}
      </TopBar>

      <Body>
        <Sidebar>
          <SidebarSection>
            <Small color="secondary60" bold>PAGES</Small>
          </SidebarSection>
          <PageList>
            {config.pages.map((page, idx) => {
              const href = buildHref(sliceName, page.route);
              const active =
                page.name === currentPageName ||
                location.pathname === href ||
                location.pathname === href.replace(/\/$/, '');
              return (
                <li key={page.name}>
                  <PageLink to={href} $active={active}>
                    <StepCircle $active={active}>{idx + 1}</StepCircle>
                    <Box>
                      <Text bold={active} marginBottom="none" style={{ fontSize: 14 }}>
                        {page.name}
                      </Text>
                      {page.story && (
                        <Small color="secondary60">{page.story}</Small>
                      )}
                    </Box>
                  </PageLink>
                </li>
              );
            })}
          </PageList>

          {config.flows && config.flows.length > 0 && (
            <SidebarSection style={{ marginTop: theme.spacing.large, paddingTop: theme.spacing.large, borderTop: `1px solid ${theme.colors.secondary20}` }}>
              <Small color="secondary60" bold>SUGGESTED FLOWS</Small>
              <Flex flexDirection="column" flexGap={theme.spacing.xSmall} marginTop="small">
                {config.flows.map((flow) => (
                  <Box key={flow.name}>
                    <Small bold color="secondary70">{flow.name}</Small>
                    <Small color="secondary60">{flow.steps.join(' → ')}</Small>
                  </Box>
                ))}
              </Flex>
            </SidebarSection>
          )}
        </Sidebar>

        <Main>
          {(traces.length > 0 || missingTraces.length > 0) && (
            <TraceChipRow>
              <Small color="secondary70" bold style={{ fontSize: 11, marginRight: 4 }}>
                SPECS
              </Small>
              {traces.map((t) => (
                <TraceChip
                  key={t.id}
                  href={t.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t.label}
                >
                  {t.id}
                  <OpenInNewIcon size="xSmall" color="primary" />
                </TraceChip>
              ))}
              {missingTraces.map((id) => (
                <TraceChipMissing key={id} title={`No registry entry for ${id} — populate src/generated/traceability.json`}>
                  {id}
                </TraceChipMissing>
              ))}
            </TraceChipRow>
          )}
          <ContentScroll>{children}</ContentScroll>
          <PrevNextBar>
            <PrevNextButton
              $align="left"
              $disabled={!prevPage}
              disabled={!prevPage}
              onClick={() => prevPage && navigate(buildHref(sliceName, prevPage.route))}
            >
              <ChevronLeftIcon size="medium" />
              <Box>
                <Small color="secondary60">Previous</Small>
                <Text bold marginBottom="none">{prevPage?.name ?? '—'}</Text>
              </Box>
            </PrevNextButton>
            <PrevNextDivider />
            <PrevNextButton
              $align="right"
              $disabled={!nextPage}
              disabled={!nextPage}
              onClick={() => nextPage && navigate(buildHref(sliceName, nextPage.route))}
            >
              <Box>
                <Small color="secondary60">Next</Small>
                <Text bold marginBottom="none">{nextPage?.name ?? '—'}</Text>
              </Box>
              <ChevronRightIcon size="medium" />
            </PrevNextButton>
          </PrevNextBar>
        </Main>

        {hasTools && (
          <ToolsDrawer $open={toolsOpen}>
            <ToolsHeader>
              <Flex alignItems="center" flexGap={theme.spacing.xSmall}>
                <SettingsIcon size="medium" color="warning60" />
                <H4 marginBottom="none">Prototype tools</H4>
              </Flex>
              <ToolsToggle $open={true} onClick={() => setToolsOpen(false)}>
                <span>Close</span>
              </ToolsToggle>
            </ToolsHeader>
            <ToolsBody>
              {notes && (
                <ToolsSection>
                  <ToolsSectionLabel>About this surface</ToolsSectionLabel>
                  {notes}
                </ToolsSection>
              )}
              {tools && (
                <ToolsSection>
                  <ToolsSectionLabel>Scenario controls</ToolsSectionLabel>
                  {tools}
                </ToolsSection>
              )}
              {(config.brdRef || config.description) && (
                <ToolsSection>
                  <ToolsSectionLabel>Spec coverage</ToolsSectionLabel>
                  {config.brdRef && (
                    <Text marginBottom="small">{config.brdRef}</Text>
                  )}
                  {config.description && (
                    <Small color="secondary70">{config.description}</Small>
                  )}
                </ToolsSection>
              )}
            </ToolsBody>
          </ToolsDrawer>
        )}
      </Body>
    </Layout>
  );
};
