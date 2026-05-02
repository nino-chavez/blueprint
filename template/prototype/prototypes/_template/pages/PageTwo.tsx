import { FunctionComponent } from 'react';
import { Box, Flex, FlexItem, Panel, Text } from '@bigcommerce/big-design';
import { Header, Page } from '@bigcommerce/big-design-patterns';
import { theme } from '@bigcommerce/big-design-theme';
import { SliceShell, SliceConfig } from '@/components/SliceShell';
import sliceConfig from '../prototype.config.json';

export const PageTwo: FunctionComponent = () => {
  const notes = (
    <Box>
      <Text marginBottom="none">
        Page Two demonstrates a second view in the same slice. The sidebar
        numbers the pages in order; the prev/next bar is wired automatically
        from the order in <code>prototype.config.json</code>.
      </Text>
    </Box>
  );

  return (
    <SliceShell
      config={sliceConfig as SliceConfig}
      sliceName="_template"
      currentPageName="Page Two"
      notes={notes}
    >
      <Page
        header={
          <Header
            title="Page Two"
            description="Replace with the second product surface in this slice."
          />
        }
      >
        <Flex flexDirection="column" flexGap={theme.spacing.medium}>
          <FlexItem>
            <Panel header="Detail">
              <Text>
                Product detail content goes here. No prototype-only context
                in the body — those notes live in the drawer.
              </Text>
            </Panel>
          </FlexItem>
        </Flex>
      </Page>
    </SliceShell>
  );
};
