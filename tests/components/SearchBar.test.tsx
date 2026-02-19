import { describe, it, expect, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import { SearchBar } from '../../src/components/SearchBar.js'

describe('SearchBar', () => {
  let unmount: (() => void) | undefined

  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  it('always renders the app name "ports"', () => {
    const result = render(<SearchBar value="" isActive={false} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('ports')
  })

  it('inactive with no value renders "to search" hint text', () => {
    const result = render(<SearchBar value="" isActive={false} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('to search')
  })

  it('active with no value renders "type to filter..." hint text', () => {
    const result = render(<SearchBar value="" isActive={true} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('type to filter...')
  })

  it('active with no value renders cursor block', () => {
    const result = render(<SearchBar value="" isActive={true} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('█')
  })

  it('active with a value renders the value text', () => {
    const result = render(<SearchBar value="node" isActive={true} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('node')
  })

  it('active with a value renders cursor block after the value', () => {
    const result = render(<SearchBar value="node" isActive={true} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('█')
  })

  it('inactive with a value renders the value text', () => {
    const result = render(<SearchBar value="node" isActive={false} />)
    unmount = result.unmount
    expect(result.lastFrame()).toContain('node')
  })

  it('inactive with a value does not render the cursor block', () => {
    const result = render(<SearchBar value="node" isActive={false} />)
    unmount = result.unmount
    expect(result.lastFrame()).not.toContain('█')
  })

  it('inactive with a value does not render hint text', () => {
    const result = render(<SearchBar value="node" isActive={false} />)
    unmount = result.unmount
    expect(result.lastFrame()).not.toContain('to search')
    expect(result.lastFrame()).not.toContain('type to filter...')
  })
})
