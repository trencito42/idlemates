declare module 'isomorphic-dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, config?: any) => string
  }
  export default DOMPurify
}
