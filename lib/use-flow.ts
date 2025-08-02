import { useCallback, useEffect, useState } from 'react';
import { FlowController, UserFlowState, UserFlowStep } from './flow-controller';

const flowController = FlowController.getInstance();

// ===== SIMPLIFIED FLOW HOOK ARCHITECTURE =====

export interface UseFlowOptions {
  autoStart?: boolean;
  onStepChange?: (step: UserFlowStep) => void;
  onFlowComplete?: () => void;
}

export interface UseFlowReturn {
  // Flow state
  currentStep: UserFlowStep;
  completedSteps: UserFlowStep[];
  isFlowActive: boolean;
  
  // User data
  userData: UserFlowState['userData'];
  
  // Flow actions
  setLanguage: (language: string) => void;
  completeVideoExperience: () => void;
  completePhoneAuth: (phone: string) => void;
  startSocialSignup: () => void;
  startEmailSignup: (email: string) => void;
  completePasswordCreation: () => void;
  completeSignin: () => void;
  completeProfile: () => void;
  completeInvitation: () => void;
  completeQualificationCheck: (qualified: boolean) => void;
  reset: () => void;
  
  // Access control
  canAccess: (step: UserFlowStep) => boolean;
}

export function useFlow(options: UseFlowOptions = {}): UseFlowReturn {
  const [currentStep, setCurrentStep] = useState<UserFlowStep>(flowController.getCurrentStep());
  const [userData, setUserData] = useState<UserFlowState['userData']>(flowController.getUserData());
  const [completedSteps, setCompletedSteps] = useState<UserFlowStep[]>([]);

  // Update state when flow controller changes
  const updateState = useCallback(() => {
    setCurrentStep(flowController.getCurrentStep());
    setUserData(flowController.getUserData());
  }, []);

  useEffect(() => {
    updateState();
  }, [updateState]);

  const setLanguage = useCallback((language: string) => {
    flowController.setLanguage(language);
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completeVideoExperience = useCallback(() => {
    flowController.completeVideoExperience();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completePhoneAuth = useCallback((phone: string) => {
    flowController.completePhoneAuth(phone);
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const startSocialSignup = useCallback(() => {
    flowController.startSocialSignup();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const startEmailSignup = useCallback((email: string) => {
    flowController.startEmailSignup(email);
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completePasswordCreation = useCallback(() => {
    flowController.completePasswordCreation();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completeSignin = useCallback(() => {
    flowController.completeSignin();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completeProfile = useCallback(() => {
    flowController.completeProfile();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completeInvitation = useCallback(() => {
    flowController.completeInvitation();
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const completeQualificationCheck = useCallback((qualified: boolean) => {
    flowController.completeQualificationCheck(qualified);
    updateState();
    options.onStepChange?.(flowController.getCurrentStep());
  }, [updateState, options]);

  const reset = useCallback(() => {
    flowController.reset();
    updateState();
  }, [updateState]);

  const canAccess = useCallback((step: UserFlowStep) => {
    return flowController.canAccess(step);
  }, []);

  return {
    currentStep,
    completedSteps,
    isFlowActive: currentStep !== 'landing',
    userData,
    setLanguage,
    completeVideoExperience,
    completePhoneAuth,
    startSocialSignup,
    startEmailSignup,
    completePasswordCreation,
    completeSignin,
    completeProfile,
    completeInvitation,
    completeQualificationCheck,
    reset,
    canAccess,
  };
}

// ===== SIMPLIFIED PAGE ACCESS HOOK =====

export function usePageAccess(pageId: string) {
  const { canAccess } = useFlow();
  
  return {
    canAccess: canAccess(pageId as UserFlowStep),
    currentStep: flowController.getCurrentStep(),
  };
}

// ===== SIMPLIFIED STEP VALIDATION HOOK =====

export function useStepValidation(stepId?: string) {
  const { canAccess } = useFlow();
  const step = stepId as UserFlowStep || flowController.getCurrentStep();
  
  return {
    isValid: canAccess(step),
    currentStep: flowController.getCurrentStep(),
  };
}

// ===== SIMPLIFIED FLOW PROGRESS HOOK =====

export function useFlowProgress() {
  const { currentStep, completedSteps } = useFlow();
  
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
  
  const currentIndex = stepOrder.indexOf(currentStep);
  const completedCount = completedSteps.length;
  const totalSteps = stepOrder.length;
  
  return {
    currentStep,
    currentStepIndex: currentIndex,
    completedSteps: completedCount,
    totalSteps,
    progressPercentage: Math.round((completedCount / totalSteps) * 100),
    isLastStep: currentIndex === totalSteps - 1,
  };
}

// ===== SIMPLIFIED USER DATA HOOK =====

export function useFlowUserData() {
  const { userData } = useFlow();
  
  return {
    userData,
    hasLanguage: !!userData.language,
    hasPhone: !!userData.phone,
    hasEmail: !!userData.email,
    isProfileComplete: !!userData.isProfileComplete,
    isQualified: !!userData.qualified,
  };
} 