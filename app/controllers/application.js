import Controller from "@ember/controller";
import { computed, action } from "@ember/object";
import { throttle } from "@ember/runloop";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";

export default class ApplicationController extends Controller {
  @service store;
  @service wordleService;
  appName = "Wordle Game";
  constructor() {
    super(...arguments);
    this.wordleService.createWordleMeta();
    this.wordleService.createKeyboard();
  }
}
