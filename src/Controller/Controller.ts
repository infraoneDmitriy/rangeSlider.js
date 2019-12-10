import Model from '../Model/Model';
import VisualModel from '../Model/VisualModel';
import { App, AppConfigurator } from '../View/AbstractFactory/App';
import { ModelState, ViewValues, VisualState } from '../helpers/interfaces';

class Controller {
  private model = new Model();
  private visualModel = new VisualModel();
  private app!: App;

  constructor(
    private anchor: HTMLElement,
    private settingsVisualModel: VisualState,
    private settingsModel: ModelState,
  ) {
    this.initMVC(settingsVisualModel, settingsModel);
  }

  private initMVC(settingsVisualModel: VisualState, settingsModel: ModelState) {
    this.model = new Model(settingsModel);
    this.visualModel.setState(settingsVisualModel);

    this.app = new AppConfigurator().main(this.visualModel.state, this.anchor);
    this.app.createUI(this.visualModel.state);
    this.bindEvents();
    this.app.init(this.visualModel.state);
  }

  private bindEvents(): void {
    this.app.on('finishInit', obj => this.arrangeHandles(obj));
    this.model.on('pxValueDone', obj => this.app.paint(obj));
    this.app.on('onUserMove', obj => this.model.counting(obj));

    // Синхронизация настроек и состояния
    this.app.UIs.settings &&
      this.app.UIs.settings.on('newSettings', obj => {
        this.model.setState(obj);
        this.arrangeHandles(obj);

        if (obj.step) {
          this.reCreateApplication();
        }
      });

    // Отрисовка настроек
    this.model.on(
      'pxValueDone',
      () =>
        this.app.UIs.settings && this.app.UIs.settings.paint({ ...this.model.state, ...this.visualModel.state } as any),
    );

    // Пересоздать слайдер
    this.app.UIs.settings &&
      this.app.UIs.settings.on('reCreateApp', newVisualModel => {
        this.visualModel.setState(newVisualModel);
        this.reCreateApplication();
      });

    // События для плагина
    this.model.on('pxValueDone', () =>
      this.anchor.dispatchEvent(new CustomEvent('onChange', { detail: this.model.state })),
    );

    // Нажатия по значениям на шкале
    this.app.UIs.scale &&
      this.app.UIs.scale.on('newValueFromScale', obj => {
        this.model.setState(obj);
        this.arrangeHandles(obj);
      });
  }

  // Расстановка бегунков
  private arrangeHandles({ edge, handles }: ViewValues) {
    if (!handles) return;

    for (let i = 0; i < handles.length; i += 1) {
      this.model.counting({
        edge: edge,
        target: handles[i] as HTMLElement,
        value: this.model.state.values[i],
      });
    }
  }

  private reCreateApplication(newVisualModel: VisualState = this.visualModel.state) {
    const settingsModel = { ...this.settingsModel, ...this.model.state };

    this.app.removeHTML();
    this.initMVC(newVisualModel, settingsModel);
  }
}

export default Controller;
