import { StatusCodes } from "./status-codes.ts";
import { T as TimeString } from "../../util/time-string.ts";

interface ResponseHeader {
  [key: string]: string;
}

export class ResponseBuilder {
  private readonly _headers: Map<string, Array<string>> = new Map<string, Array<string>>();
  private _status: StatusCodes = StatusCodes.OK;
  private _body = '';
  
  public constructor() {
    // Set default headers
    this.withHeader('Content-Type', 'text/html');
  }

  /**
   * Get all headers we've set.
   */
  public getHeaders(): typeof this._headers {
    return this._headers;
  }

  /**
   * Get a header as an array.
   * Use ResponseBuilder.getHeaderLine() if wanted as a string instead.
   * 
   * @param name
   */
  public getHeader(name: string): string[] {
    return this._headers.get(name) ?? [];
  }

  /**
   * Get a header as a string.
   * 
   * @param name
   */
  public getHeaderLine(name: string): string {
    const header = this.getHeader(name);
    return header.join(', ');
  }

  /**
   * Check if a header is set.
   * 
   * @param name
   */
  public hasHeader(name: string): boolean {
    return this._headers.has(name);
  }

  /**
   * Set a header, overriding the old value.
   * Use ResponseBuilder.withAddedHeader() if you want to set multiple values.
   * 
   * @param name
   * @param value
   */
  public withHeader(name: string, value: string): ResponseBuilder {
    this._headers.set(name, [value]);
    return this;
  }

  /**
   * Add a value to our headers.
   * Use ResponseBuilder.withHeader() if you want to override it instead.
   * 
   * @param name
   * @param value
   */
  public withAddedHeader(name: string, value: string): ResponseBuilder {
    // Check if we have existing headers
    // If not, start with an empty array
    const existing = this._headers.get(name) ?? [];
    
    // Add our value
    existing.push(value);
    
    // Save our header
    this._headers.set(name, existing);
    
    // Return this route builder
    return this;
  }

  /**
   * Set the response MIME
   * 
   * @param mime
   */
  public withType(mime = 'text/html'): ResponseBuilder {
    this.withHeader('Content-Type', mime);
    return this;
  }

  /**
   * Set our response status.
   * 
   * @param status
   */
  public withStatus(status: StatusCodes = StatusCodes.OK): ResponseBuilder {
    this._status = status;
    return this;
  }

  /**
   * Set our response body.
   * 
   * @param body
   */
  public withBody(body: string): ResponseBuilder {
    this._body = body;
    return this;
  }

  /**
   * Add headers to enable client caching
   *
   * @param duration
   */
  public withCache(duration = '+1 day'): ResponseBuilder {
    const now = new Date();
    this
      .withHeader('Date', now.toUTCString())
      .withHeader('Last-Modified', now.toUTCString())
      .withHeader('Expires', new Date(now.getTime() + TimeString`${duration}`).toUTCString())
      .withHeader( 'max-age', (Math.round(TimeString`${duration}` / 1000)).toString())
    
    return this;
  }

  /**
   * Add headers to instruct the client not to cache the response.
   */
  public withDisabledCache(): ResponseBuilder {
    this
      .withHeader('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT')
      .withHeader('Last-Modified', new Date().toUTCString())
      .withHeader('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
    
    return this;
  }

  /**
   * Build our final response that can be sent back to the client.
   */
  public build(): Response {
    // Build our headers
    const headers: ResponseHeader = <ResponseHeader>{};
    for(const name of this.getHeaders().keys()) {
      headers[name] = this.getHeaderLine(name);
    }
    
    // Return our final response
    return new Response(
      this._body,
      {
        status: this._status,
        headers: headers,
      }
    );
  }
}
