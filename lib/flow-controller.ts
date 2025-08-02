import { supabase } from './supabase';

export type UserFlowStep = 
  | 'landing'
  | 'invitation'
  | 'qualification-check'
  | 'language-selection'
  | 'intro-video'
  | 'video-experience'
  | 'phone-auth'
  | 'social-signup'
  | 'email-signup'
  | 'create-password'
  | 'signin'
  | 'profile'
  | 'main';

export interface UserFlowState {
  currentStep: UserFlowStep;
  completedSteps: UserFlowStep[];
  userData: {
    language?: string;
    phone?: string;
    email?: string;
    authProvider?: 'social' | 'email';
    isProfileComplete?: boolean;
    qualified?: boolean;
  };
}

export class FlowController {
  private static instance: FlowController;
  private currentState: UserFlowState;

  private constructor() {
    this.currentState = this.loadState();
  }

  public static getInstance(): FlowController {
    if (!FlowController.instance) {
      FlowController.instance = new FlowController();
    }
    return FlowController.instance;
  }

  private loadState(): UserFlowState {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      return {
        currentStep: 'landing',
        completedSteps: [],
        userData: {},
      };
    }

    const savedState = localStorage.getItem('userFlowState');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (error) {
        console.warn('Failed to parse saved flow state:', error);
      }
    }
    return {
      currentStep: 'landing',
      completedSteps: [],
      userData: {},
    };
  }

  private saveState(): void {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('userFlowState', JSON.stringify(this.currentState));
    }
  }

  public getCurrentStep(): UserFlowStep {
    return this.currentState.currentStep;
  }

  public getUserData(): UserFlowState['userData'] {
    return this.currentState.userData;
  }

  public canAccess(step: UserFlowStep): boolean {
    const stepOrder: UserFlowStep[] = [
      'landing',
      'invitation',
      'qualification-check',
      'language-selection',
      'intro-video',
      'video-experience',
      'phone-auth',
      'social-signup',
      'email-signup',
      'create-password',
      'signin',
      'profile',
      'main',
    ];

    const currentIndex = stepOrder.indexOf(this.currentState.currentStep);
    const targetIndex = stepOrder.indexOf(step);

    // Allow access to completed steps or the next step in sequence
    return this.currentState.completedSteps.includes(step) || targetIndex === currentIndex + 1;
  }

  public setLanguage(language: string): void {
    this.currentState.userData.language = language;
    this.completeStep('language-selection');
    this.saveState();
  }

  public completeVideoExperience(): void {
    this.completeStep('video-experience');
    this.saveState();
  }

  public completePhoneAuth(phone: string): void {
    this.currentState.userData.phone = phone;
    this.completeStep('phone-auth');
    this.saveState();
  }

  public startSocialSignup(): void {
    this.currentState.userData.authProvider = 'social';
    this.currentState.currentStep = 'social-signup';
    this.saveState();
  }

  public startEmailSignup(email: string): void {
    this.currentState.userData.authProvider = 'email';
    this.currentState.userData.email = email;
    this.currentState.currentStep = 'email-signup';
    this.saveState();
  }

  public completePasswordCreation(): void {
    this.completeStep('create-password');
    this.saveState();
  }

  public completeSignin(): void {
    this.completeStep('signin');
    this.saveState();
  }

  public completeProfile(): void {
    this.currentState.userData.isProfileComplete = true;
    this.completeStep('profile');
    this.saveState();
  }

  public completeInvitation(): void {
    this.completeStep('invitation');
    this.saveState();
  }

  public completeQualificationCheck(qualified: boolean): void {
    this.currentState.userData.qualified = qualified;
    this.completeStep('qualification-check');
    this.saveState();
  }

  private completeStep(step: UserFlowStep): void {
    if (!this.currentState.completedSteps.includes(step)) {
      this.currentState.completedSteps.push(step);
    }

    const stepOrder: UserFlowStep[] = [
      'landing',
      'invitation',
      'qualification-check',
      'language-selection',
      'intro-video',
      'video-experience',
      'phone-auth',
      'social-signup',
      'email-signup',
      'create-password',
      'signin',
      'profile',
      'main',
    ];

    const currentIndex = stepOrder.indexOf(step);
    const nextStep = stepOrder[currentIndex + 1];

    if (nextStep) {
      this.currentState.currentStep = nextStep;
    }
  }

  public reset(): void {
    this.currentState = {
      currentStep: 'landing',
      completedSteps: [],
      userData: {},
    };
    this.saveState();
  }
}

export const flowController = FlowController.getInstance(); 