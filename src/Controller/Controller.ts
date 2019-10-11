import { Model } from "../Model/Model";
import { VisualModel } from "../Model/VisualModel";
import { ApplicationConfigurator, Application } from "../View/AbstractFactory/Application";
import { IVisualModel, ITemp, IState } from "../helpers/interfaces";
import { Observer } from "../Observer/Observer";

class Controller {
  private model = new Model();
  private visualModel = new VisualModel();
  private app!: Application;

  constructor(private anchor: HTMLElement, private settingsVisualModel: {}, private settingsModel: {}) {
    this.visualModel.setState(settingsVisualModel);
    this.model.setState(settingsModel);

    this.app = new ApplicationConfigurator().main(this.visualModel.state, anchor);
    this.app.createUI(this.visualModel.state);
    this._bindEvents();
    this.app.init(this.visualModel.state as IVisualModel);
  }

  private _bindEvents() {
    this.app.on("finishInit", (obj: {}) => this._arrangeHandlers(obj));

    this.app.settings &&
      this.app.settings.on("newSettings", (obj: {}) => {
        this.model.setState(obj);
        this._arrangeHandlers(obj);
      });

    this.app.settings &&
      this.app.settings.on("reCreateApp", (state: {}) => Object.assign(this.settingsVisualModel, state));
    this.app.settings &&
      this.app.settings.on("reCreateApp", () =>
        this.reCreateApplication(this.saveOldModel(this.settingsModel, this.model.state)),
      );

    this.model.on("pxValueDone", (obj: ITemp) => this.app.paint(obj));
    this.app.on("onUserMove", (obj: {}) => this.model.setState(obj));

    this.model.on(
      "newState",
      (state: {}) => this.app.settings && this.app.settings.paint(Object.assign({}, state, this.visualModel.state)),
    );
  }

  // Начальная расстановка бегунков
  private _arrangeHandlers({ edge, handlers }: any) {
    for (let i = 0; i < handlers.length; i++) {
      this.model.setState({
        edge,
        tempTarget: handlers[i],
        tempValue: (this.model.state.values as number[])[i],
      });
    }
  }

  private reCreateApplication(oldModel: IState) {
    this.model = null;
    this.visualModel = null;
    this.app = null;
    this.anchor.innerHTML = ""; // TODO пофиксить это

    this.model = new Model();
    this.visualModel = new VisualModel();
    this.visualModel.setState(this.settingsVisualModel);
    this.model.setState(oldModel);

    this.app = new ApplicationConfigurator().main(this.visualModel.state, this.anchor);
    this.app.createUI(this.visualModel.state);
    this._bindEvents();
    this.app.init(this.visualModel.state as IVisualModel);
  }

  private saveOldModel(target: {}, obj: {}) {
    for (const prompt in target) {
      target[prompt] = obj[prompt];
    }
    return target;
  }
}

export { Controller };
