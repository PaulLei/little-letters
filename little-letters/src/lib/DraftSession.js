// Serializes saves and publish operations. One UUID belongs to exactly one letter.
export class DraftSession {
  constructor(send, letter) {
    this.send = send;
    this.id = letter?.id || crypto.randomUUID();
    this.version = letter?.version || 0;
    this.status = letter?.status || "draft";
    this.queue = Promise.resolve();
    this.publishing = false;
    this.publishPromise = null;
    this.closed = false;
  }
  enqueue(operation) {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => {});
    return result;
  }
  persist(action, content) {
    return this.enqueue(async () => {
      const response = await this.send({
        ...content,
        id: this.id,
        version: this.version,
        action,
      });
      this.version = response.letter.version;
      this.status = response.letter.status;
      return response;
    });
  }
  save(content) {
    if (this.publishing || this.closed)
      return Promise.reject(
        new Error("This letter has been sent. Open a new letter."),
      );
    return this.persist(this.status === "sent" ? "edit_sent" : "save", content);
  }
  publish(content) {
    if (this.publishPromise) return this.publishPromise;
    if (this.closed)
      return Promise.reject(new Error("This letter has already been sent."));
    this.publishing = true;
    this.publishPromise = this.persist("publish", content)
      .then((result) => {
        this.closed = true;
        return result;
      })
      .finally(() => {
        this.publishing = false;
        this.publishPromise = null;
      });
    return this.publishPromise;
  }
}
