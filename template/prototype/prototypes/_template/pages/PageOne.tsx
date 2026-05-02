import { FunctionComponent, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FlexItem,
  FormGroup,
  Panel,
  Select,
  Small,
  Text,
} from '@bigcommerce/big-design';
import { Header, Page } from '@bigcommerce/big-design-patterns';
import { theme } from '@bigcommerce/big-design-theme';
import { SliceShell, SliceConfig } from '@/components/SliceShell';
import sliceConfig from '../prototype.config.json';
import { mockRecords, statusLabel, Status } from '../data/mock';

type Scenario = 'default' | 'empty' | 'error';

export const PageOne: FunctionComponent = () => {
  const [scenario, setScenario] = useState<Scenario>('default');

  // Real product surface — render whatever the merchant or subscriber would see.
  // Anything that exists only because this is a prototype belongs in `tools` or
  // `notes` below, not here.
  const records = scenario === 'empty' ? [] : mockRecords;

  const tools = (
    <FormGroup>
      <Select<Scenario>
        label="Scenario"
        value={scenario}
        onOptionChange={(value) => value && setScenario(value)}
        options={[
          { value: 'default', content: 'Default — populated' },
          { value: 'empty', content: 'Empty state' },
          { value: 'error', content: 'Error — backend unreachable' },
        ]}
      />
    </FormGroup>
  );

  const notes = (
    <Box>
      <Text marginBottom="small">
        Replace this surface with the real product UI for your slice. Map the
        page to one or more user stories in <code>prototype.config.json</code>{' '}
        so the spec chips render correctly.
      </Text>
      <Small color="secondary70">
        Demonstrates: list view, status badges, primary CTA, scenario switching
        via the harness drawer.
      </Small>
    </Box>
  );

  return (
    <SliceShell
      config={sliceConfig as SliceConfig}
      sliceName="_template"
      currentPageName="Page One"
      tools={tools}
      notes={notes}
    >
      <Page
        header={
          <Header
            title="Page One"
            description="Replace with your real product page heading and description."
            actions={[
              {
                text: 'Primary action',
                variant: 'primary',
                onClick: () => undefined,
              },
            ]}
          />
        }
      >
        <Flex flexDirection="column" flexGap={theme.spacing.medium}>
          <FlexItem>
            <Panel header="Records">
              {records.length === 0 ? (
                <Box>
                  <Text>No records yet.</Text>
                  <Button variant="primary" marginTop="medium">
                    Create the first record
                  </Button>
                </Box>
              ) : (
                <Flex flexDirection="column" flexGap={theme.spacing.small}>
                  {records.map((record) => (
                    <FlexItem key={record.id}>
                      <Flex alignItems="center" flexGap={theme.spacing.medium}>
                        <FlexItem flexGrow={1}>
                          <Text bold marginBottom="none">
                            {record.label}
                          </Text>
                          <Small color="secondary60">
                            Created {record.createdAt}
                          </Small>
                        </FlexItem>
                        <FlexItem>
                          <Badge
                            label={statusLabel(record.status as Status)}
                            variant={
                              record.status === 'active'
                                ? 'success'
                                : record.status === 'paused'
                                  ? 'warning'
                                  : 'secondary'
                            }
                          />
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  ))}
                </Flex>
              )}
            </Panel>
          </FlexItem>
        </Flex>
      </Page>
    </SliceShell>
  );
};
