import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import Home from './page' // Adjust the import path as necessary

test('Home', async () => {
  const { container } = render(<Home />)
})