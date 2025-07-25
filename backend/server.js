const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js file system module for handling file deletion

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Enable CORS for all origins (for development). In production, configure this more strictly.
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the 'uploads' directory (if you ever wanted to view uploaded images directly)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Multer for file uploads
// Destination for uploaded files (create this directory if it doesn't exist)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Use a unique filename to prevent clashes
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

// NEW: Testicular Cancer Risk Assessment
app.post('/api/testicular-cancer', (req, res) => {
    // Destructure all new and existing features from the request body
    const {
        age, race, undescended_testicle, family_history, previous_cancer,
        klinefelter, hiv, mumps_orchitis, injury
    } = req.body.features;

    console.log('Received Testicular Cancer features:', req.body.features);

    let riskScore = 0;

    // --- Major Risk Factors (High Weight) ---
    // Personal history of testicular cancer
    if (previous_cancer === 1) riskScore += 10; // History in one testicle
    if (previous_cancer === 2) riskScore += 15; // History in both (very high risk)

    // Undescended testicle (Cryptorchidism)
    if (undescended_testicle === 1) riskScore += 8; // Uncorrected
    if (undescended_testicle === 2) riskScore += 4; // Corrected by surgery (still higher risk than general pop)

    // Klinefelter Syndrome
    if (klinefelter === 1) riskScore += 7;

    // --- Moderate Risk Factors ---
    // Family history
    if (family_history === 1) riskScore += 3; // Father
    if (family_history === 2) riskScore += 5; // Brother (higher risk)
    if (family_history === 3) riskScore += 2; // Other male relative
    if (family_history === 4) riskScore += 6; // Multiple relatives

    // HIV infection
    if (hiv === 1) riskScore += 2.5;

    // Race/Ethnicity (higher in White/Caucasian males)
    if (race === 'white') riskScore += 1.5;

    // --- Minor/Associated Factors ---
    // Age: Peak incidence 20-35, but can occur at any age
    if (age >= 20 && age <= 40) riskScore += 1;
    else if ((age >= 15 && age < 20) || (age > 40 && age <= 50)) riskScore += 0.5;

    // Mumps Orchitis
    if (mumps_orchitis === 1) riskScore += 1; // Particularly if unilateral testicular atrophy resulted

    // Testicular Injury/Trauma (controversial as direct cause, but often leads to detection)
    if (injury === 1) riskScore += 0.5;

    // Max possible risk score (approx): 15 + 8 + 7 + 6 + 2.5 + 1.5 + 1 + 1 + 0.5 = 42.5
    const maxPossibleScore = 42.5;

    let probability = Math.min(1, riskScore / maxPossibleScore);
    probability = parseFloat(probability.toFixed(2));

    let risk_level = 'Low';
    let guidance = 'Based on the provided information, your risk for testicular cancer appears low. However, regular self-examinations are crucial for early detection. If you notice any changes or have concerns, consult a urologist.';

    if (probability >= 0.70) {
        risk_level = 'High';
        guidance = 'Your profile indicates a significantly elevated risk for testicular cancer based on key factors. It is **imperative** to consult a urologist immediately for a thorough examination. Early detection of testicular cancer dramatically improves treatment outcomes. Learn how to perform testicular self-examinations regularly.';
    } else if (probability >= 0.40) {
        risk_level = 'Medium';
        guidance = 'Your profile shows some factors that suggest a medium risk for testicular cancer. While this is not a diagnosis, it is advisable to discuss these factors with a healthcare provider, ideally a urologist. Regular testicular self-examinations are strongly recommended. If you notice any lumps, swelling, or or changes, seek prompt medical attention.';
    } else if (probability >= 0.15) {
        risk_level = 'Slightly Elevated'; // A new intermediate level
        guidance = 'While your overall risk is low, some factors indicate a slightly elevated risk for testicular cancer. It is recommended to perform regular testicular self-examinations and discuss any concerns with your doctor during routine check-ups.';
    }
    // If probability < 0.15, risk_level and guidance remain 'Low'

    res.json({
        risk_level: risk_level,
        probability: probability,
        guidance: guidance
    });
});


// 1. PCOS Risk Assessment (Enhanced Mock Logic)
app.post('/api/pcos', (req, res) => {
    // Destructure all new and existing features from the request body
    const {
        age, weight, height, bmi, regular_periods, hair_growth, skin_darkening, hair_loss, weight_gain,
        difficulty_losing_weight, cycle_length, periods_per_year, acne_severity, ovarian_cysts,
        gestational_diabetes, family_diabetes, insulin_resistance, anxiety_depression, sleep_issues
    } = req.body.features;

    console.log('Received PCOS features:', req.body.features);

    // Feature weighting for more nuanced risk calculation
    let riskScore = 0;

    // --- Core Diagnostic Criteria Factors (Higher Weight) ---
    // Period regularity: Key diagnostic criterion
    if (regular_periods === 0) riskScore += 4; // Irregular/absent periods
    else if (cycle_length === 2 || cycle_length === 3 || cycle_length === 4) riskScore += 3.5; // Longer/highly irregular/no periods
    if (periods_per_year <= 8 && periods_per_year > 0) riskScore += 2.5; // Oligomenorrhea
    if (periods_per_year === 0) riskScore += 3.5; // Amenorrhea

    // Androgen excess symptoms
    if (hair_growth === 3) riskScore += 3; // Severe hirsutism
    else if (hair_growth === 2) riskScore += 2.5; // Moderate hirsutism
    else if (hair_growth === 1) riskScore += 1.5; // Mild hirsutism

    if (acne_severity === 3) riskScore += 2; // Severe acne
    else if (acne_severity === 2) riskScore += 1.5; // Moderate acne

    if (hair_loss === 1) riskScore += 1.8; // Male-pattern hair loss

    if (skin_darkening === 1) riskScore += 2.5; // Acanthosis Nigricans (strong indicator of insulin resistance)

    // Ovarian Cysts (Polycystic ovaries on ultrasound)
    if (ovarian_cysts === 1) riskScore += 3; // Previously diagnosed

    // --- Metabolic & Associated Factors (Medium Weight) ---
    // BMI factor: Higher BMI is a strong indicator
    if (bmi >= 30) riskScore += 3; // Obese
    else if (bmi >= 25) riskScore += 2; // Overweight
    else if (bmi < 18.5 && regular_periods === 0) riskScore += 1; // Underweight PCOS also exists, consider if irregular periods

    if (weight_gain === 1) riskScore += 1.5; // Rapid weight gain
    if (difficulty_losing_weight === 1) riskScore += 1.8; // Common metabolic symptom

    if (gestational_diabetes === 1) riskScore += 2; // History of GDM
    if (family_diabetes === 1) riskScore += 1.5; // Family history of T2D
    if (insulin_resistance === 1) riskScore += 2.5; // Direct diagnosis of IR

    // --- Other Related Symptoms (Lower Weight) ---
    if (anxiety_depression === 1) riskScore += 1; // Mental health impact
    if (sleep_issues === 1) riskScore += 1; // Sleep apnea risk

    // Max possible risk score (approx, sum of highest weights):
    // 4 (periods) + 3 (hair_growth) + 2 (acne) + 1.8 (hair_loss) + 2.5 (skin_darkening) + 3 (ovarian_cysts) +
    // 3 (bmi) + 1.5 (weight_gain) + 1.8 (difficulty_losing_weight) + 2 (gest_diabetes) + 1.5 (family_diabetes) +
    // 2.5 (insulin_resistance) + 1 (anxiety) + 1 (sleep_issues) = ~30.6
    const maxPossibleScore = 30.6;

    let probability = Math.min(1, riskScore / maxPossibleScore); // Normalize to 0-1
    probability = parseFloat(probability.toFixed(2)); // Round to 2 decimal places

    let risk_level = 'Low';
    let guidance = 'Based on the provided information, your risk for PCOS appears low. However, PCOS diagnosis requires a comprehensive medical evaluation. If you have any ongoing concerns, new or worsening symptoms, please consult an endocrinologist or gynecologist.';

    if (probability >= 0.65) {
        risk_level = 'High';
        guidance = 'Your profile indicates a high potential risk for PCOS based on the symptoms provided. PCOS is a complex condition, and a definitive diagnosis requires a comprehensive medical evaluation including blood tests and possibly ultrasound. It is strongly recommended to consult an endocrinologist or gynecologist for further assessment and management. Early diagnosis can help manage symptoms and prevent long-term complications.';
    } else if (probability >= 0.35) {
        risk_level = 'Medium';
        guidance = 'Your profile shows several indicators that suggest a medium risk for PCOS. While this is not a diagnosis, it is advisable to discuss these symptoms with a healthcare provider (e.g., your GP, gynecologist) for a personalized assessment. They may recommend further tests to confirm or rule out PCOS and discuss potential management strategies.';
    }
    // If probability < 0.35, risk_level and guidance remain 'Low' (set initially)

    res.json({
        risk_level: risk_level,
        probability: probability,
        guidance: guidance,
        bmi: parseFloat(bmi.toFixed(1))
    });
});

// 2. STI Symptom Classifier (Enhanced Mock Logic)
app.post('/api/sti', (req, res) => {
    // Destructure all new and existing features from the request body
    const {
        symptoms, symptom_onset, symptom_change, discharge_color, discharge_consistency, sores_description,
        partners_last_months, sexual_contact_type, condom_usage, last_unprotected, partner_symptoms, previous_diagnosis
    } = req.body;

    console.log('Received STI data:', req.body);

    if (!symptoms || symptoms.length === 0 || (symptoms.length === 1 && symptoms.includes('none'))) {
        return res.status(400).json({
            predictions: {},
            guidance: 'Please select at least one symptom to get an analysis. If you have no symptoms but concerns, consult a doctor based on your exposure history. Remember, this tool is for informational purposes only and not a diagnosis.'
        });
    }

    // Map frontend symptom names to backend's internal names if they differ
    const mappedSymptoms = symptoms.map(symptom => {
        if (symptom === 'pain_urination') return 'pain'; // Frontend uses pain_urination, backend uses pain
        if (symptom === 'unusual_discharge') return 'discharge';
        if (symptom === 'unusual_odor') return 'odor';
        if (symptom === 'sores_lesions') return 'sores';
        if (symptom === 'unusual_bleeding') return 'bleeding';
        if (symptom === 'swollen_lymph_nodes') return 'lymph_nodes'; // New backend symptom mapping
        // Add more mappings if needed
        return symptom;
    });

    // Define conditions with weighted symptoms (expanded)
    const conditions = {
        'Chlamydia': {
            symptoms: { 'discharge': 1.5, 'pain': 1.2, 'burning': 1.2, 'itching': 0.8, 'pelvic_pain': 1.0, 'bleeding': 0.7, 'lymph_nodes': 0.5 },
            commonality: 0.8, // Higher value for more common conditions
            sensitivity: { 'partners_last_months': 0.2, 'condom_usage': 0.3, 'sexual_contact_type': ['vaginal', 'anal'] }
        },
        'Gonorrhea': {
            symptoms: { 'discharge': 1.8, 'burning': 1.5, 'pain': 1.3, 'bleeding': 1.0, 'pelvic_pain': 1.0, 'sore_throat': 0.8, 'lymph_nodes': 0.6 },
            commonality: 0.7,
            sensitivity: { 'partners_last_months': 0.2, 'condom_usage': 0.3, 'sexual_contact_type': ['vaginal', 'anal', 'oral'] }
        },
        'Herpes (HSV)': {
            symptoms: { 'sores': 3.0, 'pain': 1.5, 'itching': 1.0, 'fever': 0.8, 'fatigue': 0.7, 'lymph_nodes': 1.0 },
            commonality: 0.6,
            sensitivity: { 'partners_last_months': 0.1, 'condom_usage': 0.1, 'sores_description_keywords': ['blisters', 'ulcers'] }
        },
        'Syphilis': {
            symptoms: { 'sores': 2.5, 'rash': 2.5, 'fatigue': 0.5, 'fever': 0.5, 'lymph_nodes': 1.5, 'sore_throat': 0.7 },
            commonality: 0.5,
            sensitivity: { 'partners_last_months': 0.1, 'condom_usage': 0.2, 'sores_description_keywords': ['painless ulcer'] }
        },
        'Trichomoniasis': {
            symptoms: { 'discharge': 1.7, 'odor': 2.0, 'itching': 1.5, 'burning': 1.0 },
            commonality: 0.6,
            sensitivity: { 'condom_usage': 0.2, 'sexual_contact_type': ['vaginal'] }
        },
        'Yeast Infection (Candidiasis)': { // Often confused with STIs, important to include
            symptoms: { 'itching': 2.5, 'discharge': 1.8, 'burning': 1.2, 'odor': 0.8 },
            commonality: 0.9, // Very common
            specificity: { 'discharge_consistency_keywords': ['cottage cheese-like'], 'discharge_color_keywords': ['white'] } // Specificity for yeast
        },
        'Bacterial Vaginosis (BV)': { // Another common non-STI, similar symptoms
            symptoms: { 'odor': 2.8, 'discharge': 1.5, 'itching': 0.7, 'burning': 0.5 },
            commonality: 0.85,
            specificity: { 'discharge_color_keywords': ['grey', 'green'], 'discharge_consistency_keywords': ['thin'], 'odor_characteristic_keywords': ['fishy'] } // Specificity for BV
        },
        'Urinary Tract Infection (UTI)': { // Common non-STI, overlapping symptoms
            symptoms: { 'pain': 2.5, 'burning': 2.5, 'pelvic_pain': 2.0, 'fever': 1.0, 'fatigue': 0.5 },
            commonality: 0.95
        }
    };

    const rawPredictions = {};

    for (const conditionName in conditions) {
        let matchedWeight = 0;
        let totalPossibleWeight = 0;
        const conditionData = conditions[conditionName];

        for (const sym in conditionData.symptoms) {
            totalPossibleWeight += conditionData.symptoms[sym];
            if (mappedSymptoms.includes(sym)) {
                matchedWeight += conditionData.symptoms[sym];
            }
        }

        let baseProbability = 0;
        if (totalPossibleWeight > 0) {
            baseProbability = matchedWeight / totalPossibleWeight;
        }

        let contextualBoost = 0;

        // Apply boosts/penalties based on new detailed questions
        if (symptom_onset === '1_week') contextualBoost += 0.1; // Recent onset often means acute infection
        if (symptom_change === 'worse') contextualBoost += 0.15; // Worsening symptoms

        // Sexual history factors (significant for STIs)
        if (conditionData.sensitivity) {
            if (conditionData.sensitivity.partners_last_months && partners_last_months > 1) {
                contextualBoost += conditionData.sensitivity.partners_last_months * Math.min(partners_last_months / 5, 1); // Boost for multiple partners
            }
            if (condom_usage === 'never' || condom_usage === 'sometimes') {
                contextualBoost += (conditionData.sensitivity.condom_usage || 0) * (condom_usage === 'never' ? 1.5 : 1); // Higher boost if never used
            }
            if (last_unprotected && new Date() - new Date(last_unprotected) < 90 * 24 * 60 * 60 * 1000) { // If last unprotected encounter was within 3 months
                contextualBoost += 0.15;
            }
            if (partner_symptoms === 'yes') {
                contextualBoost += 0.2;
            }
            if (previous_diagnosis === 'yes') {
                contextualBoost += 0.05; // Slight boost as history increases general risk
            }
            if (sexual_contact_type && Array.isArray(sexual_contact_type) && conditionData.sensitivity.sexual_contact_type) {
                const intersection = sexual_contact_type.filter(type => conditionData.sensitivity.sexual_contact_type.includes(type));
                if (intersection.length > 0) contextualBoost += 0.1;
            }

            // Specificity for discharge/sores characteristics
            if (discharge_color && conditionData.specificity && conditionData.specificity.discharge_color_keywords) {
                const foundKeyword = conditionData.specificity.discharge_color_keywords.some(keyword => discharge_color.toLowerCase().includes(keyword));
                if (foundKeyword) contextualBoost += 0.15;
            }
            if (discharge_consistency && conditionData.specificity && conditionData.specificity.discharge_consistency_keywords) {
                const foundKeyword = conditionData.specificity.discharge_consistency_keywords.some(keyword => discharge_consistency.toLowerCase().includes(keyword));
                if (foundKeyword) contextualBoost += 0.15;
            }
            if (sores_description && conditionData.specificity && conditionData.specificity.sores_description_keywords) {
                const foundKeyword = conditionData.specificity.sores_description_keywords.some(keyword => sores_description.toLowerCase().includes(keyword));
                if (foundKeyword) contextualBoost += 0.2;
            }
        }

        let finalProbability = baseProbability * conditionData.commonality + contextualBoost;

        if (finalProbability > 1) finalProbability = 1; // Cap at 100%

        // Only add if there's a significant match and not the 'None of these symptoms' option
        if (finalProbability >= 0.15 && !mappedSymptoms.includes('none')) {
            rawPredictions[conditionName] = finalProbability;
        }
    }

    // Sort predictions by probability in descending order and round
    const sortedPredictions = Object.entries(rawPredictions)
        .sort(([, probA], [, probB]) => probB - probA)
        .reduce((acc, [key, value]) => {
            acc[key] = parseFloat(value.toFixed(2));
            return acc;
        }, {});

    let guidance = 'Based on your reported symptoms, some potential conditions have been identified. It is crucial to consult a healthcare provider for proper diagnosis, testing, and treatment. Do not rely solely on this analysis. This tool is for informational purposes only.';

    if (Object.keys(sortedPredictions).length === 0) {
        guidance = 'No strong matches found for common STI or related conditions based on your symptoms. If symptoms persist or worsen, or if you have any sexual health concerns, please consult a healthcare professional for a confidential and accurate diagnosis.';
    } else {
        const topCondition = Object.keys(sortedPredictions)[0];
        const topProbability = sortedPredictions[topCondition];
        if (topProbability >= 0.7) {
            guidance = `Your symptoms are highly suggestive of **${topCondition}**. While this analysis is not a diagnosis, it is very important to seek immediate medical attention for testing and treatment. Early treatment is key to managing symptoms and preventing complications.`;
        } else if (topProbability >= 0.4) {
            guidance = `Your symptoms indicate a possible association with **${topCondition}** and other conditions. It is strongly recommended to consult a healthcare provider for proper diagnosis, testing, and treatment. This analysis is for informational purposes only.`;
        }
    }

    res.json({
        predictions: sortedPredictions,
        guidance: guidance
    });
});


// 3. Skin Disorder Detection (Enhanced Mock Logic)
app.post('/api/skin', upload.single('image'), (req, res) => {
    const { body_location, onset, change_recent, itchy, painful, raised_flat, discharge, triggers, allergies_eczema, medications } = req.body;
    const appearance = JSON.parse(req.body.appearance || '[]'); // Parse the JSON string back to an array
    const imageFile = req.file;

    console.log('Received skin analysis request:', {
        body_location, onset, change_recent, itchy, painful, raised_flat, discharge,
        appearance, triggers, allergies_eczema, medications,
        image: imageFile ? imageFile.filename : 'No file'
    });

    if (!imageFile) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    let conditionName = 'Common Skin Irritation';
    let confidence = 0.55; // Default confidence
    let guidance = 'This is a preliminary analysis. Skin conditions can be complex to diagnose without a physical examination. Please consult a dermatologist for a professional diagnosis and personalized advice. Avoid self-treating without medical advice.';

    // Initialize base confidence and an array of potential conditions
    const potentialConditions = [];

    // --- Apply weights based on symptom details ---
    let symptomMatchScore = 0;
    const maxSymptomScore = 10; // Max score for general symptoms, adjust as needed

    if (itchy === 'yes') symptomMatchScore += 1;
    if (painful === 'yes') symptomMatchScore += 1;
    if (discharge === 'yes') symptomMatchScore += 2; // Often indicates infection/inflammation
    if (change_recent === 'yes_worse') symptomMatchScore += 2.5; // Significant concern
    if (change_recent === 'new_appeared') symptomMatchScore += 2;
    if (onset === 'days') symptomMatchScore += 1; // Acute onset

    // Appearance factors
    if (appearance.includes('redness')) symptomMatchScore += 0.5;
    if (appearance.includes('bumps')) symptomMatchScore += 1;
    if (appearance.includes('blisters')) symptomMatchScore += 2;
    if (appearance.includes('scaly')) symptomMatchScore += 1.5;
    if (appearance.includes('crusty')) symptomMatchScore += 1.5;
    if (appearance.includes('ulcers')) symptomMatchScore += 2.5; // High concern
    if (appearance.includes('pus')) symptomMatchScore += 2; // High concern for infection

    // Special flags for high concern
    let highConcernFlag = false;
    if (appearance.includes('dark_spots') || appearance.includes('irregular_shape') || appearance.includes('uneven_color')) {
        potentialConditions.push('Potential Malignancy (e.g., Melanoma/Skin Cancer)');
        confidence = Math.random() * (0.9 - 0.7) + 0.7; // Start with higher confidence if these are present
        guidance = 'The characteristics you described (e.g., dark spots, irregular shape, uneven color) raise a significant concern for potential skin cancer or melanoma. This requires urgent professional medical attention. Please consult a dermatologist immediately for a biopsy and definitive diagnosis. Early detection is critical.';
        highConcernFlag = true;
    }
    if (body_location === 'genitals') {
        potentialConditions.push('Genital Skin Concern (Needs Professional Review)');
        confidence = Math.random() * (0.85 - 0.7) + 0.7;
        guidance = 'Any skin concerns in the genital area require prompt medical evaluation by a healthcare provider or a specialist in sexual health. Do not attempt to self-diagnose or self-treat, as these issues can be sensitive and may indicate underlying conditions.';
        highConcernFlag = true;
    }

    // --- Mock ML logic based on filename keywords and collected data ---
    const fileName = imageFile.originalname.toLowerCase();

    // Prioritize specific conditions if keywords are present in filename or strong symptoms
    if (!highConcernFlag) { // Only run if not already flagged as high concern
        if (fileName.includes('eczema') || fileName.includes('dermatitis') || (itchy === 'yes' && appearance.includes('redness') && appearance.includes('scaly'))) {
            conditionName = 'Eczema / Dermatitis';
            confidence = Math.random() * (0.85 - 0.65) + 0.65;
            guidance = 'The image and symptoms suggest eczema or dermatitis, a common inflammatory skin condition. Keeping the skin moisturized, avoiding irritants, and using mild cleansers can help. For persistent or severe cases, a dermatologist can prescribe topical corticosteroids or other treatments.';
        } else if (fileName.includes('psoriasis') || (appearance.includes('scaly') && raised_flat === 'raised' && body_location === 'scalp')) {
            conditionName = 'Psoriasis';
            confidence = Math.random() * (0.8 - 0.6) + 0.6;
            guidance = 'The analysis points towards psoriasis, a chronic autoimmune condition. Treatment options vary from topical creams to systemic medications. Consultation with a dermatologist is recommended for a personalized management plan.';
        } else if (fileName.includes('fungal') || fileName.includes('ringworm') || (itchy === 'yes' && appearance.includes('redness') && appearance.includes('scaly') && !appearance.includes('blisters'))) {
            conditionName = 'Fungal Infection (e.g., Tinea)';
            confidence = Math.random() * (0.9 - 0.7) + 0.7;
            guidance = 'The image and symptoms strongly suggest a fungal infection. Over-the-counter antifungal creams might be effective, but for stubborn or widespread infections, a doctor can prescribe stronger medication. Keep the affected area clean and dry.';
        } else if (fileName.includes('acne') || body_location === 'face' || body_location === 'back' || body_location === 'chest' && appearance.includes('bumps')) {
            conditionName = 'Acne Vulgaris';
            confidence = Math.random() * (0.75 - 0.55) + 0.55;
            guidance = 'This appears to be acne. Maintaining a consistent skincare routine, using non-comedogenic products, and avoiding harsh scrubbing can help. For persistent or severe acne, a dermatologist can offer various treatments, including prescription medications or procedures.';
        } else if (fileName.includes('wart') || fileName.includes('hpv') || (appearance.includes('bumps') && raised_flat === 'raised' && body_location !== 'face')) {
            conditionName = 'Wart (Viral)';
            confidence = Math.random() * (0.8 - 0.6) + 0.6;
            guidance = 'The image and symptoms suggest a wart, which is caused by a viral infection. Warts are generally harmless but can be bothersome. Various treatments are available, including over-the-counter options or professional removal by a doctor.';
        } else if (fileName.includes('rash') || (symptomMatchScore > 3 && !highConcernFlag)) {
            conditionName = 'Non-Specific Rash';
            confidence = Math.random() * (0.6 - 0.4) + 0.4;
            guidance = 'This appears to be a rash. Rashes can be caused by many factors, including allergies, irritants, or mild infections. If the rash persists, spreads, becomes painful, or or is accompanied by fever, please seek medical advice.';
        } else if (fileName.includes('mole') && !highConcernFlag) {
            conditionName = 'Common Mole (Nonspecific Nevus)';
            confidence = Math.random() * (0.7 - 0.5) + 0.5;
            guidance = 'This appears to be a common mole. Most moles are harmless. However, it\'s important to regularly self-check your skin for any new moles or changes in existing ones (size, shape, color, symmetry, itching, bleeding). If you notice any changes, consult a dermatologist.';
        }
    }

    // Adjust confidence based on overall symptom score
    confidence += (symptomMatchScore / maxSymptomScore) * 0.15; // Small boost for more symptoms
    if (allergies_eczema === 'yes' && (conditionName.includes('Eczema') || conditionName.includes('Rash'))) confidence += 0.05;
    if (medications && medications.length > 0 && conditionName.includes('Rash')) confidence += 0.05; // Medications can cause rashes

    confidence = Math.min(1, Math.max(0, parseFloat(confidence.toFixed(2)))); // Ensure confidence is between 0 and 1

    // Override condition name and guidance if high concern was flagged
    if (potentialConditions.length > 0) {
        conditionName = potentialConditions.join(' / ');
    }


    // Clean up the uploaded file after processing
    fs.unlink(imageFile.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
    });

    res.json({
        condition: conditionName,
        confidence: confidence,
        guidance: guidance,
        image_url: `/uploads/${imageFile.filename}` // In a real app, this would be a publicly accessible URL
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Ensure your frontend (index.html) is opened in a browser that can reach this server.');
});