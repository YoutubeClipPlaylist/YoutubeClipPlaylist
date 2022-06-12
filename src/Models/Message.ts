export class Message<T> implements IMessage<T> {
    Name = '';
    Data: T;
    constructor(name: string, data?: T) {
        this.Name = name;
        this.Data = data ?? {} as T;
    }
}

export interface IMessage<T> {
    Name: string;
    Data: T;
}
