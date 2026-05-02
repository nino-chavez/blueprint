import { FunctionComponent, useMemo } from 'react';
import { Badge, Box, Flex, FlexItem, Panel, Small, Text } from '@bigcommerce/big-design';
import { Header, Page } from '@bigcommerce/big-design-patterns';
import { CardGrid } from 'bigcommerce-design-patterns';
import { ArrowForwardIcon, BrushIcon } from '@bigcommerce/big-design-icons';
import { theme } from '@bigcommerce/big-design-theme';
import { useNavigate } from 'react-router-dom';

interface DiscoveredSlice {
  name: string;
  config: SliceConfigShape;
}

interface SliceConfigShape {
  name?: string;
  description?: string;
  brdRef?: string;
  phase?: 'MVP' | 'P2' | 'P3';
  pages?: { name: string; route: string }[];
}

const phaseColor = (phase?: SliceConfigShape['phase']): 'success' | 'warning' | 'secondary' => {
  switch (phase) {
    case 'MVP':
      return 'success';
    case 'P2':
      return 'warning';
    case 'P3':
    default:
      return 'secondary';
  }
};

/**
 * Auto-discover every generated slice. A slice is anything under
 * `prototypes/<name>/` with a `routes.tsx` and a `prototype.config.json`.
 * Names beginning with `_` (e.g. `_template`) are filtered out — they're
 * skeletons meant to be copied, not surfaced to reviewers.
 */
function useDiscoveredSlices(): DiscoveredSlice[] {
  return useMemo(() => {
    const routesGlob = import.meta.glob('../../prototypes/*/routes.tsx', { eager: false });
    const configGlob = import.meta.glob('../../prototypes/*/prototype.config.json', { eager: true });

    const slices: DiscoveredSlice[] = [];
    for (const path of Object.keys(routesGlob)) {
      const match = path.match(/prototypes\/([^/]+)\/routes\.tsx$/);
      if (!match) continue;
      const name = match[1];
      if (name.startsWith('_')) continue;

      const configPath = `../../prototypes/${name}/prototype.config.json`;
      const configMod = configGlob[configPath] as { default?: SliceConfigShape } | undefined;
      const config: SliceConfigShape = (configMod?.default as SliceConfigShape) ?? {};
      slices.push({ name, config });
    }
    slices.sort((a, b) => (a.config.name ?? a.name).localeCompare(b.config.name ?? b.name));
    return slices;
  }, []);
}

export const Home: FunctionComponent = () => {
  const navigate = useNavigate();
  const slices = useDiscoveredSlices();

  const items = slices.map(({ name, config }) => ({
    heading: config.name ?? name,
    description: [config.description, config.brdRef].filter(Boolean).join(' — '),
    icon: <BrushIcon size="xLarge" />,
    onClick: () => navigate(`/prototypes/${name}/`),
  }));

  return (
    <Page
      header={
        <Header
          title="Prototype Studio"
          description={`${slices.length} slice${slices.length === 1 ? '' : 's'} generated. Run /blueprint-prototype <slice-name> to add more.`}
        />
      }
    >
      <Flex flexDirection="column" flexGap={theme.spacing.xLarge}>
        <FlexItem>
          <Panel header="Phase Legend">
            <Flex flexGap={theme.spacing.medium} alignItems="center">
              <FlexItem>
                <Badge label="MVP" variant={phaseColor('MVP')} />
              </FlexItem>
              <FlexItem>
                <Badge label="P2" variant={phaseColor('P2')} />
              </FlexItem>
              <FlexItem>
                <Badge label="P3" variant={phaseColor('P3')} />
              </FlexItem>
              <FlexItem>
                <Small color="secondary60">
                  Slice phase comes from each slice's <code>prototype.config.json</code>.
                </Small>
              </FlexItem>
            </Flex>
          </Panel>
        </FlexItem>

        {slices.length === 0 ? (
          <FlexItem>
            <Panel header="No slices yet">
              <Box>
                <Text>
                  This is a fresh BigBlueprint prototype. Generate your first slice by copying{' '}
                  <code>prototypes/_template/</code> to <code>prototypes/&lt;your-slice-name&gt;/</code>{' '}
                  and customizing it, or by running the <code>/blueprint-prototype</code> skill.
                </Text>
                <Text marginTop="medium">
                  See <code>CONVENTIONS.md</code> for the slice-shell rules every page must follow.
                </Text>
              </Box>
            </Panel>
          </FlexItem>
        ) : (
          <FlexItem>
            <Panel header="Slices">
              <CardGrid items={items} format="action" />
            </Panel>
          </FlexItem>
        )}

        <FlexItem>
          <Panel header="Add a slice">
            <Box>
              <Text>
                Copy <code>prototypes/_template/</code> to <code>prototypes/&lt;your-slice-name&gt;/</code>,
                update <code>prototype.config.json</code>, and customize the page components.
                The Home page rediscovers slices on reload — no edits to <code>Home.tsx</code> needed.
              </Text>
              <Flex marginTop="medium" alignItems="center" flexGap={theme.spacing.xSmall}>
                <ArrowForwardIcon size="small" color="secondary60" />
                <Small color="secondary60">
                  See <code>CONVENTIONS.md</code> for required architecture and anti-patterns.
                </Small>
              </Flex>
            </Box>
          </Panel>
        </FlexItem>
      </Flex>
    </Page>
  );
};
