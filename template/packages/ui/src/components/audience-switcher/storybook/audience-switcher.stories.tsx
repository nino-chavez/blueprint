import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudienceSwitcher, type Audience } from '../audience-switcher';

const meta: Meta<typeof AudienceSwitcher> = {
  title: 'Portal / AudienceSwitcher',
  component: AudienceSwitcher,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof AudienceSwitcher>;

export const Default: Story = {
  render: () => {
    const [audience, setAudience] = useState<Audience>('discovery');
    return <AudienceSwitcher value={audience} onChange={setAudience} />;
  },
};

export const Executive: Story = {
  render: () => {
    const [audience, setAudience] = useState<Audience>('executive');
    return <AudienceSwitcher value={audience} onChange={setAudience} />;
  },
};

export const Internal: Story = {
  render: () => {
    const [audience, setAudience] = useState<Audience>('internal');
    return <AudienceSwitcher value={audience} onChange={setAudience} />;
  },
};
