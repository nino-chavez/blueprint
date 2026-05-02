import { theme } from '@bigcommerce/big-design-theme';
import styled from 'styled-components';

/**
 * SidebarGrid — "content column + right-side info panel" layout. Sidebar
 * width is configurable via $sidebarWidth (default 340px).
 *
 * Usage:
 *   <SidebarGrid>
 *     <Box>{mainContent}</Box>
 *     <Box>{sidebarContent}</Box>
 *   </SidebarGrid>
 */
export const SidebarGrid = styled.div<{ $sidebarWidth?: number }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${(p) => p.$sidebarWidth ?? 340}px;
  gap: ${theme.spacing.medium};
  align-items: start;
`;

/**
 * Card — standard white container: white bg, secondary20 border, 8px radius,
 * large padding, medium bottom margin.
 */
export const Card = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.secondary20};
  border-radius: 8px;
  padding: ${theme.spacing.large};
  margin-bottom: ${theme.spacing.medium};
`;
