import { useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode.react";

const categories = {
  "सरकारी योजनाएं": {
    "प्रधानमंत्री किसान सम्मान निधि योजना": {
      title: "प्रधानमंत्री किसान सम्मान निधि योजना की पूरी जानकारी",
      videoUrl: "https://www.youtube.com/watch?v=87ev--e_zeg",
      qrUrl: "https://example.com/qr1",
    },
    "किसान क्रेडिट कार्ड": {
      title: "किसान क्रेडिट कार्ड योजना: आवेदन प्रक्रिया और लाभ",
      videoUrl: "https://www.youtube.com/watch?v=m4W5ONPyFek",
      qrUrl: "https://docs.google.com/document/d/1VC4W8Z-J9paO17bCHe-rEwtAOfND84TiC0e3sV1vmUM/edit?tab=t.0",
    },
    "प्रधानमंत्री फसल बीमा योजना": {
      title: "फसल बीमा योजना: कैसे करें आवेदन और क्या हैं फायदे",
      videoUrl: "https://www.youtube.com/watch?v=TMgnqwpksVg",
      qrUrl: "https://example.com/qr3",
    },
    "नाबार्ड योजनाएं": {
      title: "नाबार्ड की योजनाएं: किसानों के लिए अवसर",
      videoUrl: "https://www.youtube.com/watch?v=jXRa-dkRYFc",
      qrUrl: "https://example.com/qr4",
    },
  },
  "खेती की तकनीकें": {
    "जैविक खेती": {
      title: "जैविक खेती कैसे करें: एक विस्तृत गाइड",
      videoUrl: "https://www.youtube.com/watch?v=2qiNKen-rm0",
      qrUrl: "https://example.com/qr5",
    },
    "ड्रिप सिंचाई": {
      title: "ड्रिप सिंचाई प्रणाली: स्थापना और लाभ",
      videoUrl: "https://www.youtube.com/watch?v=4ucbtnYIgjo",
      qrUrl: "https://example.com/qr6",
    },
    "फसल चक्र के लाभ": {
      title: "फसल चक्र: मिट्टी की उर्वरता बढ़ाने की तकनीक",
      videoUrl: "https://www.youtube.com/watch?v=UZ6zvZAdE-E",
      qrUrl: "https://example.com/qr7",
    },
  },
  "मौसम और जलवायु अपडेट": {
    "मौसमी फसल गाइड": {
      title: "मौसमी फसलों की जानकारी और खेती के टिप्स",
      videoUrl: "https://www.youtube.com/watch?v=PDau070A4n4",
      qrUrl: "https://example.com/qr8",
    },
    "मानसून और सिंचाई के टिप्स": {
      title: "मानसून में सिंचाई कैसे करें: विशेषज्ञ सलाह",
      videoUrl: "https://www.youtube.com/watch?v=PEKJ_4Ftibk",
      qrUrl: "https://example.com/qr9",
    },
  },
  "बाजार मूल्य और व्यापार": {
    "ताज़ा फसल मूल्य": {
      title: "आज के मंडी भाव: प्रमुख फसलों के ताज़ा दाम",
      videoUrl: "https://www.youtube.com/watch?v=jhCEp_vNgJc",
      qrUrl: "https://example.com/qr10",
    },
    "ऑनलाइन फसल कैसे बेचें": {
      title: "ऑनलाइन फसल बिक्री: प्रक्रिया और प्लेटफॉर्म",
      videoUrl: "https://www.youtube.com/watch?v=EKBkR3Htaik",
      qrUrl: "https://example.com/qr11",
    },
  },
  "कीटनाशक और उर्वरक का उपयोग": {
    "सर्वश्रेष्ठ जैविक कीटनाशक": {
      title: "जैविक कीटनाशक: घर पर बनाने की विधि",
      videoUrl: "https://www.youtube.com/watch?v=hZNszVlamm8",
      qrUrl: "https://example.com/qr12",
    },
    "मात्रा और आवेदन विधियाँ": {
      title: "उर्वरकों का सही उपयोग: मात्रा और समय",
      videoUrl: "https://www.youtube.com/watch?v=zsTsWBkRGBc",
      qrUrl: "https://example.com/qr13",
    },
  },
  "आधुनिक कृषि मशीनरी": {
    "कृषि में ड्रोन का उपयोग": {
      title: "कृषि में ड्रोन तकनीक: उपयोग और लाभ",
      videoUrl: "https://www.youtube.com/watch?v=u7iBV1QUU1M",
      qrUrl: "https://example.com/qr14",
    },
    "ट्रैक्टर रखरखाव टिप्स": {
      title: "ट्रैक्टर की देखभाल: महत्वपूर्ण टिप्स",
      videoUrl: "https://www.youtube.com/watch?v=MqrMsUCcdtA",
      qrUrl: "https://example.com/qr15",
    },
  },
  "सफलता की कहानियाँ": {
    "प्रगतिशील किसानों के साथ साक्षात्कार": {
      title: "सफल किसान की कहानी: प्रेरणादायक यात्रा",
      videoUrl: "https://www.youtube.com/watch?v=n_h6gFqKgys",
      qrUrl: "https://example.com/qr16",
    },
  },
  "पशुधन और पोल्ट्री फार्मिंग": {
    "डेयरी फार्मिंग टिप्स": {
      title: "डेयरी फार्मिंग: दूध उत्पादन बढ़ाने के उपाय",
      videoUrl: "https://www.youtube.com/watch?v=Q_AteW2rW6E",
      qrUrl: "https://example.com/qr17",
    },
    "पोल्ट्री के लिए सर्वश्रेष्ठ नस्लें": {
      title: "पोल्ट्री फार्मिंग: मुर्गियों की बेहतरीन नस्लें",
      videoUrl: "https://www.youtube.com/watch?v=Moexnha_TAU",
      qrUrl: "https://example.com/qr18",
    },
  },
};

function VidQRConnect() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
  };

  const handleBack = () => {
    if (selectedSubCategory) {
      setSelectedSubCategory(null);
    } else {
      setSelectedCategory(null);
    }
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        VidQR Connect
      </motion.h1>

      <div className="space-y-6">
        {selectedCategory ? (
          <div>
            <button
              onClick={handleBack}
              className="mb-4 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← वापस जाएं
            </button>

            {selectedSubCategory ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6">
                  {categories[selectedCategory][selectedSubCategory].title}
                </h2>
                <div className="flex flex-col items-center space-y-6">
                  <QRCode
                    value={
                      categories[selectedCategory][selectedSubCategory].qrUrl
                    }
                    size={256}
                    level="H"
                    includeMargin
                    className="bg-white p-4 rounded-xl"
                  />
                  <p className="text-gray-400  text-2xl">
                    QR कोड को स्कैन करें और सारांश प्राप्त करें
                  </p>
                  <iframe
                    width="560"
                    height="315"
                    src={categories[selectedCategory][
                      selectedSubCategory
                    ].videoUrl.replace("watch?v=", "embed/")}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-xl"
                  ></iframe>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(categories[selectedCategory]).map(
                  (subCategory) => (
                    <motion.div
                      key={subCategory}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSubCategoryClick(subCategory)}
                    >
                      <h3 className="text-xl font-semibold">{subCategory}</h3>
                      <p className="text-gray-400 mt-2">
                        {categories[selectedCategory][subCategory].title}
                      </p>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(categories).map((category) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                <h2 className="text-2xl font-bold">{category}</h2>
                <p className="text-gray-400 mt-2">
                  {Object.keys(categories[category]).length} विषय
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VidQRConnect;
