
export class LocalQueue {
  private onConsumeFn?: (string) => Promise<void>;

  public onConsume(fn: (string) => Promise<void>) {
    this.onConsumeFn = fn;
  }

  public consume(string: string): this {
    const fn = this.onConsumeFn;
    if (fn) {
      Promise.all([fn(string)]).then();
    }
    return this;
  }

}

export class LocalPublisher {
  private onPublishFn?: (key: string, value: string) => Promise<void>;

  public onPublish(fn: (key: string, value: string) => Promise<void>) {
    this.onPublishFn = fn;
  }

  public publish(key: string, value: string): this {
    const fn = this.onPublishFn;
    if (fn) {
      Promise.all([fn(key, value)]).then();
    }
    return this;
  }
}

export class LocalSubscriber {

  onConsumeFn?: (key: string, value: string) => Promise<void>;

  onConsume(fn: (key: string, value: string) => Promise<void>) {
    this.onConsumeFn = fn;
  }

  consume(key: string, value: string): this {
    const fn = this.onConsumeFn;
    if (fn) {
      Promise.all([fn(key, value)]).then();
    }
    return this;
  }

}