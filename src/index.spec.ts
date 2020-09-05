describe('foo', () => {
  test('2 + 2 should be 4', () => {
    function add(a: number, b: number): number {
      return a + b
    }
    expect(add(2, 2)).toBe(4)
  })
})
