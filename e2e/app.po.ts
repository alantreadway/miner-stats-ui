import { browser, by, element, promise } from 'protractor';

export class AppPage {
  // tslint:disable-next-line:no-any
  public navigateTo(): promise.Promise<any> {
    return browser.get('/');
  }

  // tslint:disable-next-line:no-any
  public getParagraphText(): promise.Promise<any> {
    return element(by.css('msu-root h1')).getText();
  }
}
