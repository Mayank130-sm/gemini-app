$(document).ready(function() {
  // --- Modal Logic ---
  // Check if the disclaimer has been accepted before. Using localStorage.
  const disclaimerAccepted = localStorage.getItem('silentscan_disclaimer_accepted');
  if (!disclaimerAccepted) {
    $('#disclaimer-modal').removeClass('hidden').addClass('animate-fade-in');
  }

  // Event listener for accepting and closing the disclaimer modal.
  $('#accept-disclaimer, #close-modal').click(function() {
    $('#disclaimer-modal').addClass('animate-fade-out').one('animationend', function() {
      $(this).addClass('hidden').removeClass('animate-fade-out');
    });
    // Store in localStorage that the disclaimer has been accepted.
    localStorage.setItem('silentscan_disclaimer_accepted', 'true');
  });

  // --- Notification Function ---
  // A reusable function to display success or error notifications.
  function showNotification(message, type = 'info', duration = 3000) {
    const $notificationArea = $('#notification-area');
    // Clear existing classes, add 'notification' base class, type (error/success), message, and display.
    $notificationArea.removeClass().addClass('notification').addClass(type).text(message).removeClass('hidden').addClass('animate-fade-in');

    // Hide the notification after a specified duration.
    setTimeout(() => {
      $notificationArea.addClass('animate-fade-out').one('animationend', function() {
        $(this).addClass('hidden').removeClass('animate-fade-out');
      });
    }, duration);
  }

  // --- Tab switching functionality ---
  // Handle clicks on navigation tabs to show/hide corresponding content.
  $('.tab-button').click(function() {
    $('.tab-button').removeClass('tab-active'); // Remove active class from all tabs.
    $(this).addClass('tab-active'); // Add active class to the clicked tab.
    
    const targetId = $(this).data('target'); // Get the target content ID from data-target attribute.
    $('.tab-content').addClass('hidden'); // Hide all tab content.
    $(`#${targetId}`).removeClass('hidden'); // Show the targeted tab content.
  });

  // --- "Try Again" button functionality ---
  // Reset forms and hide results when "Try Again" is clicked.
  $('.try-again-btn').click(function() {
    const formContainer = $(this).closest('.module-card');
    formContainer.find('form').show(); // Show the form.
    formContainer.find('[id$="-result"]').addClass('hidden'); // Hide the result section.

    // Specific reset for Skin Analysis image preview.
    if (formContainer.find('#skin-form').length) {
      $('#image-preview').addClass('hidden').attr('src', '');
      $('#image-placeholder').removeClass('hidden');
      $('#skin-image').val(''); // Clear the file input.
    }

    // Reset checkboxes for STI and remove validation error states.
    formContainer.find('input[type="checkbox"]').prop('checked', false);
    formContainer.find('input, select').removeClass('invalid'); // Remove error styles from inputs/selects.
    formContainer.find('.error-message').addClass('hidden'); // Hide all error messages.

    // Reset all select elements to their first option.
    formContainer.find('select').each(function() {
      if ($(this).attr('required')) {
        $(this).val($(this).find('option:first').val());
      } else {
        $(this).val($(this).find('option:first').val());
      }
    });
    // Clear text, number, and date input fields.
    formContainer.find('input[type="number"], input[type="text"], input[type="date"]').val('');

    // Hide conditional STI/Skin fields on try again.
    $('#sti-discharge-details').addClass('hidden');
    $('#sti-discharge-consistency-details').addClass('hidden');
    $('#sti-sores-details').addClass('hidden');
  });

  // --- Client-side form validation helper ---
  // Validates all required fields within a given form.
  function validateForm(formId) {
    let isValid = true;
    $(`#${formId} [required]`).each(function() {
      const $input = $(this);
      const value = $input.val();
      const errorId = $input.attr('id') + '-error';
      const $errorMessage = $(`#${errorId}`);

      // Check if value is empty/null/whitespace or an empty array for multiple selects.
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        $input.addClass('invalid');
        if ($errorMessage.length) $errorMessage.removeClass('hidden').text('This field is required.');
        isValid = false;
      } else if ($input.attr('type') === 'number') { // Specific validation for number inputs.
        const min = parseFloat($input.attr('min'));
        const max = parseFloat($input.attr('max'));
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal < min || numVal > max) {
          $input.addClass('invalid');
          if ($errorMessage.length) $errorMessage.removeClass('hidden').text(`Please enter a number between ${min} and ${max}.`);
          isValid = false;
        } else {
          $input.removeClass('invalid');
          if ($errorMessage.length) $errorMessage.addClass('hidden');
        }
      } else { // For other valid required fields.
        $input.removeClass('invalid');
        if ($errorMessage.length) $errorMessage.addClass('hidden');
      }
    });
    return isValid;
  }

  // --- Real-time input validation (on change/blur) ---
  // Apply validation visually as the user interacts with input fields.
  $('input[type="number"], select').on('change blur', function() {
    const $input = $(this);
    const value = $input.val();
    const errorId = $input.attr('id') + '-error';
    const $errorMessage = $(`#${errorId}`);

    if ($input.attr('required') && (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === ''))) {
      $input.addClass('invalid');
      if ($errorMessage.length) $errorMessage.removeClass('hidden').text('This field is required.');
    } else if ($input.attr('type') === 'number') {
      const min = parseFloat($input.attr('min'));
      const max = parseFloat($input.attr('max'));
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal < min || numVal > max) {
        $input.addClass('invalid');
        if ($errorMessage.length) $errorMessage.removeClass('hidden').text(`Please enter a number between ${min} and ${max}.`);
      } else {
        $input.removeClass('invalid');
        if ($errorMessage.length) $errorMessage.addClass('hidden');
      }
    } else {
      $input.removeClass('invalid');
      if ($errorMessage.length) $errorMessage.addClass('hidden');
    }
  });


  // --- Conditional display for STI symptom details ---
  // Show/hide discharge details based on "Unusual discharge" checkbox.
  $('#sti-discharge').change(function() {
    if ($(this).is(':checked')) {
      $('#sti-discharge-details, #sti-discharge-consistency-details').removeClass('hidden');
    } else {
      $('#sti-discharge-details, #sti-discharge-consistency-details').addClass('hidden');
      $('#sti-discharge-color, #sti-discharge-consistency').val(''); // Clear values.
    }
  });

  // Show/hide sores details based on "Sores, blisters, or lesions" checkbox.
  $('#sti-sores').change(function() {
    if ($(this).is(':checked')) {
      $('#sti-sores-details').removeClass('hidden');
    } else {
      $('#sti-sores-details').addClass('hidden');
      $('#sti-sores-description').val(''); // Clear value.
    }
  });

  // --- Form submissions (AJAX calls to backend) ---

  // Breast Cancer Form Submission
  $('#breast-cancer-form').submit(async function(e) {
    e.preventDefault();
    // Validate form before submitting.
    if (!validateForm('breast-cancer-form')) {
      showNotification('Please fill in all required fields and correct errors.', 'error');
      return;
    }

    const submitButton = $(this).find('button[type="submit"]');
    const originalButtonHtml = submitButton.html();
    submitButton.html('<div class="spinner mr-2"></div> Analyzing...'); // Show spinner.
    
    // Collect form data.
    const features = {
      age: parseInt($('#bc-age').val()),
      family_history: parseInt($('#bc-family-history').val()),
      previous_biopsy: parseInt($('#bc-previous-biopsy').val()),
      chest_radiation: parseInt($('#bc-chest-radiation').val()),
      genetic_mutation: parseInt($('#bc-genetic-mutation').val()),
      menstrual_age: parseInt($('#bc-menstrual-age').val()),
      first_pregnancy: parseInt($('#bc-first-pregnancy').val()),
      num_pregnancies: parseInt($('#bc-num-pregnancies').val()),
      breastfed: parseInt($('#bc-breastfed').val()),
      menopause_age: parseInt($('#bc-menopause-age').val()),
      density: parseInt($('#bc-density').val()),
      hormone_therapy: parseInt($('#bc-hormone-therapy').val()),
      alcohol: parseInt($('#bc-alcohol').val()),
      physical_activity: parseInt($('#bc-physical-activity').val())
    };
    
    try {
      // Make API call.
      const response = await fetch('https://magicloops.dev/api/loop/0f802499-8dde-4dc2-bc2a-79a8003ea49a/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Update UI with results.
      $(this).hide();
      $('#breast-cancer-result').removeClass('hidden');
      $('#bc-risk-level').text(data.risk_level || 'Unknown');
      
      const probability = data.probability ? (data.probability * 100).toFixed(0) : 45;
      $('#bc-risk-bar').css('width', `${probability}%`);
      
      $('#bc-guidance').text(data.guidance || 'Please consult a healthcare professional for medical advice.');
      showNotification('Breast Cancer Risk analyzed successfully!', 'success');
      
    } catch (error) {
      console.error('Error submitting breast cancer form:', error);
      showNotification('Failed to analyze risk: ' + error.message, 'error');
    } finally {
      submitButton.html(originalButtonHtml); // Restore button text.
    }
  });
  
  // Testicular Cancer Form Submission
  $('#testicular-cancer-form').submit(async function(e) {
    e.preventDefault();
    if (!validateForm('testicular-cancer-form')) {
      showNotification('Please fill in all required fields and correct errors.', 'error');
      return;
    }

    const submitButton = $(this).find('button[type="submit"]');
    const originalButtonHtml = submitButton.html();
    submitButton.html('<div class="spinner mr-2"></div> Analyzing...');
    
    const features = {
      age: parseInt($('#tc-age').val()),
      race: $('#tc-race').val(),
      undescended_testicle: parseInt($('#tc-undescended-testicle').val()),
      family_history: parseInt($('#tc-family-history').val()),
      previous_cancer: parseInt($('#tc-previous-cancer').val()),
      klinefelter: parseInt($('#tc-klinefelter').val()),
      hiv: parseInt($('#tc-hiv').val()),
      mumps_orchitis: parseInt($('#tc-mumps-orchitis').val()),
      injury: parseInt($('#tc-injury').val())
    };

    try {
      const response = await fetch('http://localhost:3000/api/testicular-cancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      $(this).hide();
      $('#testicular-cancer-result').removeClass('hidden');
      $('#tc-risk-level').text(data.risk_level || 'Unknown');
      
      const probability = data.probability ? (data.probability * 100).toFixed(0) : 50;
      $('#tc-risk-bar').css('width', `${probability}%`);
      
      $('#tc-guidance').text(data.guidance || 'Please consult a healthcare professional for medical advice.');
      showNotification('Testicular Cancer Risk analyzed successfully!', 'success');
      
    } catch (error) {
      console.error('Error submitting testicular cancer form:', error);
      showNotification('Failed to analyze risk: ' + error.message, 'error');
    } finally {
      submitButton.html(originalButtonHtml);
    }
  });
  
  // PCOS Form Submission
  $('#pcos-form').submit(async function(e) {
    e.preventDefault();
    if (!validateForm('pcos-form')) {
      showNotification('Please fill in all required fields and correct errors.', 'error');
      return;
    }

    const submitButton = $(this).find('button[type="submit"]');
    const originalButtonHtml = submitButton.html();
    submitButton.html('<div class="spinner mr-2"></div> Analyzing...');
    
    const weight = parseFloat($('#pcos-weight').val());
    const heightInM = parseFloat($('#pcos-height').val()) / 100;
    const bmi = weight / (heightInM * heightInM);
    
    const features = {
      age: parseInt($('#pcos-age').val()),
      weight: weight,
      height: parseFloat($('#pcos-height').val()),
      bmi: parseFloat(bmi.toFixed(1)),
      weight_gain: parseInt($('#pcos-weight-gain').val()),
      difficulty_losing_weight: parseInt($('#pcos-difficulty-losing-weight').val()),
      regular_periods: parseInt($('#pcos-cycle').val()),
      cycle_length: parseInt($('#pcos-cycle-length').val()),
      periods_per_year: parseInt($('#pcos-periods-per-year').val()),
      hair_growth: parseInt($('#pcos-hair-growth').val()),
      hair_loss: parseInt($('#pcos-hair-loss').val()),
      acne_severity: parseInt($('#pcos-acne-severity').val()),
      skin_darkening: parseInt($('#pcos-skin').val()),
      ovarian_cysts: parseInt($('#pcos-ovarian-cysts').val()),
      gestational_diabetes: parseInt($('#pcos-gestational-diabetes').val()),
      family_diabetes: parseInt($('#pcos-family-diabetes').val()),
      insulin_resistance: parseInt($('#pcos-insulin-resistance').val()),
      anxiety_depression: parseInt($('#pcos-anxiety-depression').val()),
      sleep_issues: parseInt($('#pcos-sleep-issues').val())
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/pcos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      $(this).hide();
      $('#pcos-result').removeClass('hidden');
      $('#pcos-risk-level').text(data.risk_level || 'Unknown');
      
      const probability = data.probability ? (data.probability * 100).toFixed(0) : 50;
      $('#pcos-risk-bar').css('width', `${probability}%`);
      
      $('#pcos-guidance').text(data.guidance || 'Please consult a healthcare professional for medical advice.');
      showNotification('PCOS Risk analyzed successfully!', 'success');
      
    } catch (error) {
      console.error('Error submitting PCOS form:', error);
      showNotification('Failed to analyze risk: ' + error.message, 'error');
    } finally {
      submitButton.html(originalButtonHtml);
    }
  });
  
  // STI Form Submission
  $('#sti-form').submit(async function(e) {
    e.preventDefault();
    if (!validateForm('sti-form')) {
      showNotification('Please fill in all required fields and correct errors.', 'error');
      return;
    }

    const submitButton = $(this).find('button[type="submit"]');
    const originalButtonHtml = submitButton.html();
    submitButton.html('<div class="spinner mr-2"></div> Analyzing...');
    
    const symptoms = [];
    $('input[name="symptoms"]:checked').each(function() {
      symptoms.push($(this).val());
    });

    const detailedFeatures = {
      symptoms: symptoms,
      symptom_onset: $('#sti-symptom-onset').val(),
      symptom_change: $('#sti-symptom-change').val(),
      discharge_color: $('#sti-discharge-color').val(),
      discharge_consistency: $('#sti-discharge-consistency').val(),
      sores_description: $('#sti-sores-description').val(),
      partners_last_months: $('#sti-partners-last-months').val() ? parseInt($('#sti-partners-last-months').val()) : null,
      sexual_contact_type: $('#sti-sexual-contact-type').val(),
      condom_usage: $('#sti-condom-usage').val(),
      last_unprotected: $('#sti-last-unprotected').val(),
      partner_symptoms: $('#sti-partner-symptoms').val(),
      previous_diagnosis: $('#sti-previous-diagnosis').val()
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/sti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailedFeatures)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      $(this).hide();
      $('#sti-result').removeClass('hidden');
      
      $('#sti-conditions').empty(); // Clear previous conditions.
      
      if (data.predictions && Object.keys(data.predictions).length > 0) {
        Object.entries(data.predictions).forEach(([condition, probability]) => {
          const percentMatch = (probability * 100).toFixed(0);
          $('#sti-conditions').append(`
            <div class="p-3 border border-gray-700 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-gray-300 font-medium">${condition}</span>
                <span class="text-neonBlue">${percentMatch}% match</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div class="result-bar" style="width: ${percentMatch}%"></div>
              </div>
            </div>
          `);
        });
      } else {
        $('#sti-conditions').append('<p class="text-gray-300">No significant matches found for the selected symptoms. Please try selecting more symptoms or consult a healthcare professional if you have concerns.</p>');
      }
      
      $('#sti-guidance').text(data.guidance || 'Please consult a healthcare professional for medical advice.');
      showNotification('STI Symptom analysis complete!', 'success');
      
    } catch (error) {
      console.error('Error submitting STI form:', error);
      showNotification('Failed to analyze symptoms: ' + error.message, 'error');
    } finally {
      submitButton.html(originalButtonHtml);
    }
  });
  
  // Skin Analysis Form Submission
  $('#skin-form').submit(async function(e) {
    e.preventDefault();
    // Basic file input validation as it's not handled by validateForm
    if (!$('#skin-image')[0].files[0]) {
      showNotification('Please upload an image for skin analysis.', 'error');
      return;
    }
    if (!validateForm('skin-form')) {
      showNotification('Please fill in all required fields and correct errors.', 'error');
      return;
    }
    
    const submitButton = $(this).find('button[type="submit"]');
    const originalButtonHtml = submitButton.html();
    submitButton.html('<div class="spinner mr-2"></div> Analyzing...');
    
    const file = $('#skin-image')[0].files[0];
    const bodyLocation = $('#skin-location').val();
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('body_location', bodyLocation);
    formData.append('onset', $('#skin-onset').val());
    formData.append('change_recent', $('#skin-change').val());
    formData.append('itchy', $('#skin-itchy').val());
    formData.append('painful', $('#skin-painful').val());
    formData.append('raised_flat', $('#skin-raised-flat').val());
    formData.append('discharge', $('#skin-discharge').val());
    formData.append('appearance', JSON.stringify($('#skin-appearance').val()));
    formData.append('triggers', $('#skin-triggers').val());
    formData.append('allergies_eczema', $('#skin-allergies-eczema').val());
    formData.append('medications', $('#skin-medications').val());

    try {
      const response = await fetch('http://localhost:3000/api/skin', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      $(this).hide();
      $('#skin-result').removeClass('hidden');
      
      const imageUrl = $('#image-preview').attr('src');
      $('#result-image-preview').attr('src', imageUrl);
      
      $('#skin-condition-name').text(data.condition || 'Unknown Condition');
      
      const confidence = data.confidence ? (data.confidence * 100).toFixed(0) : 0;
      $('#skin-confidence').text(`${confidence}%`);
      $('#skin-confidence-bar').css('width', `${confidence}%`);
      
      $('#skin-guidance').text(data.guidance || 'Please consult a healthcare professional for medical advice.');
      showNotification('Skin analysis complete!', 'success');
      
    } catch (error) {
      console.error('Error submitting skin form:', error);
      showNotification('Failed to analyze image: ' + error.message, 'error');
    } finally {
      submitButton.html(originalButtonHtml);
    }
  });
});