import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, X } from 'lucide-react';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import toast from 'react-hot-toast';

const Report = () => {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  
  const [formData, setFormData] = useState({
    land_area: '',
    location: '',
    crop_type: '',
    soil_type: '',
    irrigation_facilities: false,
    irrigation_type: '',
    crop_stage: '',
    seed_type: '',
    crop_rotation: false,
    rotation_details: '',
    weed_management: false,
    weed_methods: '',
    drainage_system: false,
    drainage_details: '',
    pest_disease: false,
    pest_disease_list: '',
    fertilizer_application: false,
    fertilizer_details: '',
    crop_specific_diseases: false,
    disease_details: '',
    farming_equipment: false,
    equipment_list: '',
    labor_availability: false,
    labor_quantity: 0,
    submit_button: false,
    output_area: ''
  });

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBooleanChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    if (checked) {
      setActiveModal(name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const response = await axios.post('http://localhost:8000/report/generate_report', formData);
      setReportData(null); // Force React to re-render
      setTimeout(() => setReportData(response.data), 100); // Reapply data after a short delay
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generatePDF = async () => {
    if (!reportRef.current) {
      toast.error("No report data to generate PDF!");
      return;
    }
  
    try {
      setIsGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure rendering
  
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
  
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      pdf.save('agricultural-report.pdf');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  

  const Modal = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          {children}
        </div>
      </div>
    );
  };

  const DetailInput = ({ label, name, value, onChange, type = "text" }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className={`w-10 h-6 bg-gray-300 rounded-full shadow-inner ${checked ? 'bg-green-500' : ''}`}></div>
        <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-1'} top-1`}></div>
      </div>
      <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Agricultural Report Generator</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <DetailInput
              label="Land Area (acres)"
              name="land_area"
              value={formData.land_area}
              onChange={handleInputChange}
              type="number"
            />

            <DetailInput
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type
              </label>
              <select 
                value={formData.crop_type}
                onChange={(e) => handleInputChange('crop_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select crop type</option>
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="corn">Corn</option>
              </select>
            </div>

            {/* Boolean Fields */}
            <div className="space-y-4">
              <Toggle
                label="Irrigation Facilities"
                checked={formData.irrigation_facilities}
                onChange={(e) => handleBooleanChange('irrigation_facilities', e.target.checked)}
              />
            </div>

            {/* Add other fields similarly */}
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating Report...' : 'Generate Report'}
          </button>
        </form>

        {/* Modals */}
        <Modal
          title="Irrigation Details"
          isOpen={activeModal === 'irrigation_facilities'}
          onClose={() => setActiveModal(null)}
        >
          <DetailInput
            label="Irrigation Type"
            name="irrigation_type"
            value={formData.irrigation_type}
            onChange={handleInputChange}
          />
          <button 
            onClick={() => setActiveModal(null)}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save
          </button>
        </Modal>

        
        {reportData && (
  <div ref={reportRef} className="mt-8 p-6 bg-black rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold mb-4">Agricultural Report</h2>
    {/* Displaying Land Details */}
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Land Details</h3>
        <p>Area: {reportData.report.land_area || "Data not available"} acres</p>
        <p>Location: {reportData.report.location || "Data not available"}</p>
      </div>

      {/* User Advantages and Disadvantages */}
      <div>
        <h3 className="font-semibold">User Advantages & Disadvantages</h3>
        <div className="space-y-2">
          <p><strong>Advantages:</strong> {reportData.report.output_format.user_advantages_disadvantages.advantages}</p>
          <p><strong>Disadvantages:</strong> {reportData.report.output_format.user_advantages_disadvantages.disadvantages}</p>
        </div>
      </div>

      {/* Actionable Suggestions */}
      <div>
        <h3 className="font-semibold">Actionable Suggestions</h3>
        <p>{reportData.report.output_format.user_advantages_disadvantages.actionable_suggestions}</p>
      </div>

      {/* FAQ Section */}
      <div>
        <h3 className="font-semibold">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {reportData.report.general_faq_questions.map((faq, index) => (
            <div key={index} className="space-y-1">
              <p><strong>Q:</strong> {faq.question}</p>
              <p><strong>A:</strong> {faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Things to Take Care Of */}
      <div>
        <h3 className="font-semibold">Important Things to Take Care Of</h3>
        <ul className="list-disc pl-6">
          {reportData.report.important_things_to_take_care_of.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Good Methods and Practices */}
      <div>
        <h3 className="font-semibold">Good Methods and Practices</h3>
        <ul className="list-disc pl-6">
          {reportData.report.good_methods_and_practices.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Futuristic Predictions */}
      <div>
        <h3 className="font-semibold">Futuristic Predictions</h3>
        <ul className="list-disc pl-6">
          {reportData.report.futuristic_predictions.map((prediction, index) => (
            <li key={index}>{prediction}</li>
          ))}
        </ul>
      </div>

      {/* Use Case Scenarios */}
      <div>
        <h3 className="font-semibold">Use Case Scenarios</h3>
        <div className="space-y-2">
          {reportData.report.use_case_scenarios.map((scenario, index) => (
            <div key={index} className="space-y-1">
              <p><strong>Scenario:</strong> {scenario.scenario}</p>
              <p><strong>Potential Outcome:</strong> {scenario.potential_outcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Guidelines */}
      <div>
        <h3 className="font-semibold">Step-by-Step Guidelines</h3>
        <div className="space-y-2">
          {reportData.report.step_by_step_guidelines.map((step, index) => (
            <div key={index} className="space-y-1">
              <p><strong>Step:</strong> {step.step}</p>
              <p><strong>Description:</strong> {step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistakes to Avoid */}
      <div>
        <h3 className="font-semibold">Common Mistakes to Avoid</h3>
        <div className="space-y-2">
          {reportData.report.common_mistakes_to_avoid.map((mistake, index) => (
            <div key={index} className="space-y-1">
              <p><strong>Mistake:</strong> {mistake.mistake}</p>
              <p><strong>Reason:</strong> {mistake.reason}</p>
              <p><strong>Alternative Approach:</strong> {mistake.alternative_approach}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Evaluation Metrics */}
      <div>
        <h3 className="font-semibold">Critical Evaluation Metrics</h3>
        <div className="space-y-2">
          {reportData.report.critical_evaluation_metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <p><strong>Metric:</strong> {metric.metric}</p>
              <p><strong>Importance:</strong> {metric.importance}</p>
              <p><strong>How to Measure:</strong> {metric.how_to_measure}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
 


            
            <div className="flex gap-4 mt-6">
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                View QR Code
              </button>
            </div>
          </div>
        )}

     
        <Modal
          title="Scan QR Code to View Report"
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        >
          <div className="flex justify-center p-4">
            <QRCode value={window.location.href} size={256} />
          </div>
        </Modal>
      </motion.div>
    </div>
  );
};

export default Report;