import { render, screen } from '@testing-library/react';

import { Description } from '@/components/fundraisers/description';

describe('Description', () => {
  it('renders nothing when value is empty', () => {
    const { container } = render(<Description mode='read' value='' />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sanitized html in read mode', () => {
    const malicious =
      '<p>Hello</p><script>alert(1)</script><p>World</p><p onclick=\"alert(2)\">Click</p>';

    render(<Description mode='read' value={malicious} />);

    const paragraphs = screen.getAllByText(/Hello|World|Click/);
    expect(paragraphs.length).toBeGreaterThan(0);

    const container = paragraphs[0].closest('div')?.parentElement;
    expect(container?.innerHTML).not.toContain('<script>');
    expect(container?.innerHTML).not.toContain('onclick');
  });
});


