import { c as createCommonjsModule, g as getDefaultExportFromCjs } from './common/_commonjsHelpers-8c19dec8.js';

var mappings = new Map([
	['General_Category', new Map([
		['C', 'Other'],
		['Cc', 'Control'],
		['cntrl', 'Control'],
		['Cf', 'Format'],
		['Cn', 'Unassigned'],
		['Co', 'Private_Use'],
		['Cs', 'Surrogate'],
		['L', 'Letter'],
		['LC', 'Cased_Letter'],
		['Ll', 'Lowercase_Letter'],
		['Lm', 'Modifier_Letter'],
		['Lo', 'Other_Letter'],
		['Lt', 'Titlecase_Letter'],
		['Lu', 'Uppercase_Letter'],
		['M', 'Mark'],
		['Combining_Mark', 'Mark'],
		['Mc', 'Spacing_Mark'],
		['Me', 'Enclosing_Mark'],
		['Mn', 'Nonspacing_Mark'],
		['N', 'Number'],
		['Nd', 'Decimal_Number'],
		['digit', 'Decimal_Number'],
		['Nl', 'Letter_Number'],
		['No', 'Other_Number'],
		['P', 'Punctuation'],
		['punct', 'Punctuation'],
		['Pc', 'Connector_Punctuation'],
		['Pd', 'Dash_Punctuation'],
		['Pe', 'Close_Punctuation'],
		['Pf', 'Final_Punctuation'],
		['Pi', 'Initial_Punctuation'],
		['Po', 'Other_Punctuation'],
		['Ps', 'Open_Punctuation'],
		['S', 'Symbol'],
		['Sc', 'Currency_Symbol'],
		['Sk', 'Modifier_Symbol'],
		['Sm', 'Math_Symbol'],
		['So', 'Other_Symbol'],
		['Z', 'Separator'],
		['Zl', 'Line_Separator'],
		['Zp', 'Paragraph_Separator'],
		['Zs', 'Space_Separator'],
		['Other', 'Other'],
		['Control', 'Control'],
		['Format', 'Format'],
		['Unassigned', 'Unassigned'],
		['Private_Use', 'Private_Use'],
		['Surrogate', 'Surrogate'],
		['Letter', 'Letter'],
		['Cased_Letter', 'Cased_Letter'],
		['Lowercase_Letter', 'Lowercase_Letter'],
		['Modifier_Letter', 'Modifier_Letter'],
		['Other_Letter', 'Other_Letter'],
		['Titlecase_Letter', 'Titlecase_Letter'],
		['Uppercase_Letter', 'Uppercase_Letter'],
		['Mark', 'Mark'],
		['Spacing_Mark', 'Spacing_Mark'],
		['Enclosing_Mark', 'Enclosing_Mark'],
		['Nonspacing_Mark', 'Nonspacing_Mark'],
		['Number', 'Number'],
		['Decimal_Number', 'Decimal_Number'],
		['Letter_Number', 'Letter_Number'],
		['Other_Number', 'Other_Number'],
		['Punctuation', 'Punctuation'],
		['Connector_Punctuation', 'Connector_Punctuation'],
		['Dash_Punctuation', 'Dash_Punctuation'],
		['Close_Punctuation', 'Close_Punctuation'],
		['Final_Punctuation', 'Final_Punctuation'],
		['Initial_Punctuation', 'Initial_Punctuation'],
		['Other_Punctuation', 'Other_Punctuation'],
		['Open_Punctuation', 'Open_Punctuation'],
		['Symbol', 'Symbol'],
		['Currency_Symbol', 'Currency_Symbol'],
		['Modifier_Symbol', 'Modifier_Symbol'],
		['Math_Symbol', 'Math_Symbol'],
		['Other_Symbol', 'Other_Symbol'],
		['Separator', 'Separator'],
		['Line_Separator', 'Line_Separator'],
		['Paragraph_Separator', 'Paragraph_Separator'],
		['Space_Separator', 'Space_Separator']
	])],
	['Script', new Map([
		['Adlm', 'Adlam'],
		['Aghb', 'Caucasian_Albanian'],
		['Ahom', 'Ahom'],
		['Arab', 'Arabic'],
		['Armi', 'Imperial_Aramaic'],
		['Armn', 'Armenian'],
		['Avst', 'Avestan'],
		['Bali', 'Balinese'],
		['Bamu', 'Bamum'],
		['Bass', 'Bassa_Vah'],
		['Batk', 'Batak'],
		['Beng', 'Bengali'],
		['Bhks', 'Bhaiksuki'],
		['Bopo', 'Bopomofo'],
		['Brah', 'Brahmi'],
		['Brai', 'Braille'],
		['Bugi', 'Buginese'],
		['Buhd', 'Buhid'],
		['Cakm', 'Chakma'],
		['Cans', 'Canadian_Aboriginal'],
		['Cari', 'Carian'],
		['Cham', 'Cham'],
		['Cher', 'Cherokee'],
		['Copt', 'Coptic'],
		['Qaac', 'Coptic'],
		['Cprt', 'Cypriot'],
		['Cyrl', 'Cyrillic'],
		['Deva', 'Devanagari'],
		['Dogr', 'Dogra'],
		['Dsrt', 'Deseret'],
		['Dupl', 'Duployan'],
		['Egyp', 'Egyptian_Hieroglyphs'],
		['Elba', 'Elbasan'],
		['Ethi', 'Ethiopic'],
		['Geor', 'Georgian'],
		['Glag', 'Glagolitic'],
		['Gong', 'Gunjala_Gondi'],
		['Gonm', 'Masaram_Gondi'],
		['Goth', 'Gothic'],
		['Gran', 'Grantha'],
		['Grek', 'Greek'],
		['Gujr', 'Gujarati'],
		['Guru', 'Gurmukhi'],
		['Hang', 'Hangul'],
		['Hani', 'Han'],
		['Hano', 'Hanunoo'],
		['Hatr', 'Hatran'],
		['Hebr', 'Hebrew'],
		['Hira', 'Hiragana'],
		['Hluw', 'Anatolian_Hieroglyphs'],
		['Hmng', 'Pahawh_Hmong'],
		['Hrkt', 'Katakana_Or_Hiragana'],
		['Hung', 'Old_Hungarian'],
		['Ital', 'Old_Italic'],
		['Java', 'Javanese'],
		['Kali', 'Kayah_Li'],
		['Kana', 'Katakana'],
		['Khar', 'Kharoshthi'],
		['Khmr', 'Khmer'],
		['Khoj', 'Khojki'],
		['Knda', 'Kannada'],
		['Kthi', 'Kaithi'],
		['Lana', 'Tai_Tham'],
		['Laoo', 'Lao'],
		['Latn', 'Latin'],
		['Lepc', 'Lepcha'],
		['Limb', 'Limbu'],
		['Lina', 'Linear_A'],
		['Linb', 'Linear_B'],
		['Lisu', 'Lisu'],
		['Lyci', 'Lycian'],
		['Lydi', 'Lydian'],
		['Mahj', 'Mahajani'],
		['Maka', 'Makasar'],
		['Mand', 'Mandaic'],
		['Mani', 'Manichaean'],
		['Marc', 'Marchen'],
		['Medf', 'Medefaidrin'],
		['Mend', 'Mende_Kikakui'],
		['Merc', 'Meroitic_Cursive'],
		['Mero', 'Meroitic_Hieroglyphs'],
		['Mlym', 'Malayalam'],
		['Modi', 'Modi'],
		['Mong', 'Mongolian'],
		['Mroo', 'Mro'],
		['Mtei', 'Meetei_Mayek'],
		['Mult', 'Multani'],
		['Mymr', 'Myanmar'],
		['Narb', 'Old_North_Arabian'],
		['Nbat', 'Nabataean'],
		['Newa', 'Newa'],
		['Nkoo', 'Nko'],
		['Nshu', 'Nushu'],
		['Ogam', 'Ogham'],
		['Olck', 'Ol_Chiki'],
		['Orkh', 'Old_Turkic'],
		['Orya', 'Oriya'],
		['Osge', 'Osage'],
		['Osma', 'Osmanya'],
		['Palm', 'Palmyrene'],
		['Pauc', 'Pau_Cin_Hau'],
		['Perm', 'Old_Permic'],
		['Phag', 'Phags_Pa'],
		['Phli', 'Inscriptional_Pahlavi'],
		['Phlp', 'Psalter_Pahlavi'],
		['Phnx', 'Phoenician'],
		['Plrd', 'Miao'],
		['Prti', 'Inscriptional_Parthian'],
		['Rjng', 'Rejang'],
		['Rohg', 'Hanifi_Rohingya'],
		['Runr', 'Runic'],
		['Samr', 'Samaritan'],
		['Sarb', 'Old_South_Arabian'],
		['Saur', 'Saurashtra'],
		['Sgnw', 'SignWriting'],
		['Shaw', 'Shavian'],
		['Shrd', 'Sharada'],
		['Sidd', 'Siddham'],
		['Sind', 'Khudawadi'],
		['Sinh', 'Sinhala'],
		['Sogd', 'Sogdian'],
		['Sogo', 'Old_Sogdian'],
		['Sora', 'Sora_Sompeng'],
		['Soyo', 'Soyombo'],
		['Sund', 'Sundanese'],
		['Sylo', 'Syloti_Nagri'],
		['Syrc', 'Syriac'],
		['Tagb', 'Tagbanwa'],
		['Takr', 'Takri'],
		['Tale', 'Tai_Le'],
		['Talu', 'New_Tai_Lue'],
		['Taml', 'Tamil'],
		['Tang', 'Tangut'],
		['Tavt', 'Tai_Viet'],
		['Telu', 'Telugu'],
		['Tfng', 'Tifinagh'],
		['Tglg', 'Tagalog'],
		['Thaa', 'Thaana'],
		['Thai', 'Thai'],
		['Tibt', 'Tibetan'],
		['Tirh', 'Tirhuta'],
		['Ugar', 'Ugaritic'],
		['Vaii', 'Vai'],
		['Wara', 'Warang_Citi'],
		['Xpeo', 'Old_Persian'],
		['Xsux', 'Cuneiform'],
		['Yiii', 'Yi'],
		['Zanb', 'Zanabazar_Square'],
		['Zinh', 'Inherited'],
		['Qaai', 'Inherited'],
		['Zyyy', 'Common'],
		['Zzzz', 'Unknown'],
		['Adlam', 'Adlam'],
		['Caucasian_Albanian', 'Caucasian_Albanian'],
		['Arabic', 'Arabic'],
		['Imperial_Aramaic', 'Imperial_Aramaic'],
		['Armenian', 'Armenian'],
		['Avestan', 'Avestan'],
		['Balinese', 'Balinese'],
		['Bamum', 'Bamum'],
		['Bassa_Vah', 'Bassa_Vah'],
		['Batak', 'Batak'],
		['Bengali', 'Bengali'],
		['Bhaiksuki', 'Bhaiksuki'],
		['Bopomofo', 'Bopomofo'],
		['Brahmi', 'Brahmi'],
		['Braille', 'Braille'],
		['Buginese', 'Buginese'],
		['Buhid', 'Buhid'],
		['Chakma', 'Chakma'],
		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
		['Carian', 'Carian'],
		['Cherokee', 'Cherokee'],
		['Coptic', 'Coptic'],
		['Cypriot', 'Cypriot'],
		['Cyrillic', 'Cyrillic'],
		['Devanagari', 'Devanagari'],
		['Dogra', 'Dogra'],
		['Deseret', 'Deseret'],
		['Duployan', 'Duployan'],
		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
		['Elbasan', 'Elbasan'],
		['Ethiopic', 'Ethiopic'],
		['Georgian', 'Georgian'],
		['Glagolitic', 'Glagolitic'],
		['Gunjala_Gondi', 'Gunjala_Gondi'],
		['Masaram_Gondi', 'Masaram_Gondi'],
		['Gothic', 'Gothic'],
		['Grantha', 'Grantha'],
		['Greek', 'Greek'],
		['Gujarati', 'Gujarati'],
		['Gurmukhi', 'Gurmukhi'],
		['Hangul', 'Hangul'],
		['Han', 'Han'],
		['Hanunoo', 'Hanunoo'],
		['Hatran', 'Hatran'],
		['Hebrew', 'Hebrew'],
		['Hiragana', 'Hiragana'],
		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
		['Pahawh_Hmong', 'Pahawh_Hmong'],
		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
		['Old_Hungarian', 'Old_Hungarian'],
		['Old_Italic', 'Old_Italic'],
		['Javanese', 'Javanese'],
		['Kayah_Li', 'Kayah_Li'],
		['Katakana', 'Katakana'],
		['Kharoshthi', 'Kharoshthi'],
		['Khmer', 'Khmer'],
		['Khojki', 'Khojki'],
		['Kannada', 'Kannada'],
		['Kaithi', 'Kaithi'],
		['Tai_Tham', 'Tai_Tham'],
		['Lao', 'Lao'],
		['Latin', 'Latin'],
		['Lepcha', 'Lepcha'],
		['Limbu', 'Limbu'],
		['Linear_A', 'Linear_A'],
		['Linear_B', 'Linear_B'],
		['Lycian', 'Lycian'],
		['Lydian', 'Lydian'],
		['Mahajani', 'Mahajani'],
		['Makasar', 'Makasar'],
		['Mandaic', 'Mandaic'],
		['Manichaean', 'Manichaean'],
		['Marchen', 'Marchen'],
		['Medefaidrin', 'Medefaidrin'],
		['Mende_Kikakui', 'Mende_Kikakui'],
		['Meroitic_Cursive', 'Meroitic_Cursive'],
		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
		['Malayalam', 'Malayalam'],
		['Mongolian', 'Mongolian'],
		['Mro', 'Mro'],
		['Meetei_Mayek', 'Meetei_Mayek'],
		['Multani', 'Multani'],
		['Myanmar', 'Myanmar'],
		['Old_North_Arabian', 'Old_North_Arabian'],
		['Nabataean', 'Nabataean'],
		['Nko', 'Nko'],
		['Nushu', 'Nushu'],
		['Ogham', 'Ogham'],
		['Ol_Chiki', 'Ol_Chiki'],
		['Old_Turkic', 'Old_Turkic'],
		['Oriya', 'Oriya'],
		['Osage', 'Osage'],
		['Osmanya', 'Osmanya'],
		['Palmyrene', 'Palmyrene'],
		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
		['Old_Permic', 'Old_Permic'],
		['Phags_Pa', 'Phags_Pa'],
		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
		['Phoenician', 'Phoenician'],
		['Miao', 'Miao'],
		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
		['Rejang', 'Rejang'],
		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
		['Runic', 'Runic'],
		['Samaritan', 'Samaritan'],
		['Old_South_Arabian', 'Old_South_Arabian'],
		['Saurashtra', 'Saurashtra'],
		['SignWriting', 'SignWriting'],
		['Shavian', 'Shavian'],
		['Sharada', 'Sharada'],
		['Siddham', 'Siddham'],
		['Khudawadi', 'Khudawadi'],
		['Sinhala', 'Sinhala'],
		['Sogdian', 'Sogdian'],
		['Old_Sogdian', 'Old_Sogdian'],
		['Sora_Sompeng', 'Sora_Sompeng'],
		['Soyombo', 'Soyombo'],
		['Sundanese', 'Sundanese'],
		['Syloti_Nagri', 'Syloti_Nagri'],
		['Syriac', 'Syriac'],
		['Tagbanwa', 'Tagbanwa'],
		['Takri', 'Takri'],
		['Tai_Le', 'Tai_Le'],
		['New_Tai_Lue', 'New_Tai_Lue'],
		['Tamil', 'Tamil'],
		['Tangut', 'Tangut'],
		['Tai_Viet', 'Tai_Viet'],
		['Telugu', 'Telugu'],
		['Tifinagh', 'Tifinagh'],
		['Tagalog', 'Tagalog'],
		['Thaana', 'Thaana'],
		['Tibetan', 'Tibetan'],
		['Tirhuta', 'Tirhuta'],
		['Ugaritic', 'Ugaritic'],
		['Vai', 'Vai'],
		['Warang_Citi', 'Warang_Citi'],
		['Old_Persian', 'Old_Persian'],
		['Cuneiform', 'Cuneiform'],
		['Yi', 'Yi'],
		['Zanabazar_Square', 'Zanabazar_Square'],
		['Inherited', 'Inherited'],
		['Common', 'Common'],
		['Unknown', 'Unknown']
	])],
	['Script_Extensions', new Map([
		['Adlm', 'Adlam'],
		['Aghb', 'Caucasian_Albanian'],
		['Ahom', 'Ahom'],
		['Arab', 'Arabic'],
		['Armi', 'Imperial_Aramaic'],
		['Armn', 'Armenian'],
		['Avst', 'Avestan'],
		['Bali', 'Balinese'],
		['Bamu', 'Bamum'],
		['Bass', 'Bassa_Vah'],
		['Batk', 'Batak'],
		['Beng', 'Bengali'],
		['Bhks', 'Bhaiksuki'],
		['Bopo', 'Bopomofo'],
		['Brah', 'Brahmi'],
		['Brai', 'Braille'],
		['Bugi', 'Buginese'],
		['Buhd', 'Buhid'],
		['Cakm', 'Chakma'],
		['Cans', 'Canadian_Aboriginal'],
		['Cari', 'Carian'],
		['Cham', 'Cham'],
		['Cher', 'Cherokee'],
		['Copt', 'Coptic'],
		['Qaac', 'Coptic'],
		['Cprt', 'Cypriot'],
		['Cyrl', 'Cyrillic'],
		['Deva', 'Devanagari'],
		['Dogr', 'Dogra'],
		['Dsrt', 'Deseret'],
		['Dupl', 'Duployan'],
		['Egyp', 'Egyptian_Hieroglyphs'],
		['Elba', 'Elbasan'],
		['Ethi', 'Ethiopic'],
		['Geor', 'Georgian'],
		['Glag', 'Glagolitic'],
		['Gong', 'Gunjala_Gondi'],
		['Gonm', 'Masaram_Gondi'],
		['Goth', 'Gothic'],
		['Gran', 'Grantha'],
		['Grek', 'Greek'],
		['Gujr', 'Gujarati'],
		['Guru', 'Gurmukhi'],
		['Hang', 'Hangul'],
		['Hani', 'Han'],
		['Hano', 'Hanunoo'],
		['Hatr', 'Hatran'],
		['Hebr', 'Hebrew'],
		['Hira', 'Hiragana'],
		['Hluw', 'Anatolian_Hieroglyphs'],
		['Hmng', 'Pahawh_Hmong'],
		['Hrkt', 'Katakana_Or_Hiragana'],
		['Hung', 'Old_Hungarian'],
		['Ital', 'Old_Italic'],
		['Java', 'Javanese'],
		['Kali', 'Kayah_Li'],
		['Kana', 'Katakana'],
		['Khar', 'Kharoshthi'],
		['Khmr', 'Khmer'],
		['Khoj', 'Khojki'],
		['Knda', 'Kannada'],
		['Kthi', 'Kaithi'],
		['Lana', 'Tai_Tham'],
		['Laoo', 'Lao'],
		['Latn', 'Latin'],
		['Lepc', 'Lepcha'],
		['Limb', 'Limbu'],
		['Lina', 'Linear_A'],
		['Linb', 'Linear_B'],
		['Lisu', 'Lisu'],
		['Lyci', 'Lycian'],
		['Lydi', 'Lydian'],
		['Mahj', 'Mahajani'],
		['Maka', 'Makasar'],
		['Mand', 'Mandaic'],
		['Mani', 'Manichaean'],
		['Marc', 'Marchen'],
		['Medf', 'Medefaidrin'],
		['Mend', 'Mende_Kikakui'],
		['Merc', 'Meroitic_Cursive'],
		['Mero', 'Meroitic_Hieroglyphs'],
		['Mlym', 'Malayalam'],
		['Modi', 'Modi'],
		['Mong', 'Mongolian'],
		['Mroo', 'Mro'],
		['Mtei', 'Meetei_Mayek'],
		['Mult', 'Multani'],
		['Mymr', 'Myanmar'],
		['Narb', 'Old_North_Arabian'],
		['Nbat', 'Nabataean'],
		['Newa', 'Newa'],
		['Nkoo', 'Nko'],
		['Nshu', 'Nushu'],
		['Ogam', 'Ogham'],
		['Olck', 'Ol_Chiki'],
		['Orkh', 'Old_Turkic'],
		['Orya', 'Oriya'],
		['Osge', 'Osage'],
		['Osma', 'Osmanya'],
		['Palm', 'Palmyrene'],
		['Pauc', 'Pau_Cin_Hau'],
		['Perm', 'Old_Permic'],
		['Phag', 'Phags_Pa'],
		['Phli', 'Inscriptional_Pahlavi'],
		['Phlp', 'Psalter_Pahlavi'],
		['Phnx', 'Phoenician'],
		['Plrd', 'Miao'],
		['Prti', 'Inscriptional_Parthian'],
		['Rjng', 'Rejang'],
		['Rohg', 'Hanifi_Rohingya'],
		['Runr', 'Runic'],
		['Samr', 'Samaritan'],
		['Sarb', 'Old_South_Arabian'],
		['Saur', 'Saurashtra'],
		['Sgnw', 'SignWriting'],
		['Shaw', 'Shavian'],
		['Shrd', 'Sharada'],
		['Sidd', 'Siddham'],
		['Sind', 'Khudawadi'],
		['Sinh', 'Sinhala'],
		['Sogd', 'Sogdian'],
		['Sogo', 'Old_Sogdian'],
		['Sora', 'Sora_Sompeng'],
		['Soyo', 'Soyombo'],
		['Sund', 'Sundanese'],
		['Sylo', 'Syloti_Nagri'],
		['Syrc', 'Syriac'],
		['Tagb', 'Tagbanwa'],
		['Takr', 'Takri'],
		['Tale', 'Tai_Le'],
		['Talu', 'New_Tai_Lue'],
		['Taml', 'Tamil'],
		['Tang', 'Tangut'],
		['Tavt', 'Tai_Viet'],
		['Telu', 'Telugu'],
		['Tfng', 'Tifinagh'],
		['Tglg', 'Tagalog'],
		['Thaa', 'Thaana'],
		['Thai', 'Thai'],
		['Tibt', 'Tibetan'],
		['Tirh', 'Tirhuta'],
		['Ugar', 'Ugaritic'],
		['Vaii', 'Vai'],
		['Wara', 'Warang_Citi'],
		['Xpeo', 'Old_Persian'],
		['Xsux', 'Cuneiform'],
		['Yiii', 'Yi'],
		['Zanb', 'Zanabazar_Square'],
		['Zinh', 'Inherited'],
		['Qaai', 'Inherited'],
		['Zyyy', 'Common'],
		['Zzzz', 'Unknown'],
		['Adlam', 'Adlam'],
		['Caucasian_Albanian', 'Caucasian_Albanian'],
		['Arabic', 'Arabic'],
		['Imperial_Aramaic', 'Imperial_Aramaic'],
		['Armenian', 'Armenian'],
		['Avestan', 'Avestan'],
		['Balinese', 'Balinese'],
		['Bamum', 'Bamum'],
		['Bassa_Vah', 'Bassa_Vah'],
		['Batak', 'Batak'],
		['Bengali', 'Bengali'],
		['Bhaiksuki', 'Bhaiksuki'],
		['Bopomofo', 'Bopomofo'],
		['Brahmi', 'Brahmi'],
		['Braille', 'Braille'],
		['Buginese', 'Buginese'],
		['Buhid', 'Buhid'],
		['Chakma', 'Chakma'],
		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
		['Carian', 'Carian'],
		['Cherokee', 'Cherokee'],
		['Coptic', 'Coptic'],
		['Cypriot', 'Cypriot'],
		['Cyrillic', 'Cyrillic'],
		['Devanagari', 'Devanagari'],
		['Dogra', 'Dogra'],
		['Deseret', 'Deseret'],
		['Duployan', 'Duployan'],
		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
		['Elbasan', 'Elbasan'],
		['Ethiopic', 'Ethiopic'],
		['Georgian', 'Georgian'],
		['Glagolitic', 'Glagolitic'],
		['Gunjala_Gondi', 'Gunjala_Gondi'],
		['Masaram_Gondi', 'Masaram_Gondi'],
		['Gothic', 'Gothic'],
		['Grantha', 'Grantha'],
		['Greek', 'Greek'],
		['Gujarati', 'Gujarati'],
		['Gurmukhi', 'Gurmukhi'],
		['Hangul', 'Hangul'],
		['Han', 'Han'],
		['Hanunoo', 'Hanunoo'],
		['Hatran', 'Hatran'],
		['Hebrew', 'Hebrew'],
		['Hiragana', 'Hiragana'],
		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
		['Pahawh_Hmong', 'Pahawh_Hmong'],
		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
		['Old_Hungarian', 'Old_Hungarian'],
		['Old_Italic', 'Old_Italic'],
		['Javanese', 'Javanese'],
		['Kayah_Li', 'Kayah_Li'],
		['Katakana', 'Katakana'],
		['Kharoshthi', 'Kharoshthi'],
		['Khmer', 'Khmer'],
		['Khojki', 'Khojki'],
		['Kannada', 'Kannada'],
		['Kaithi', 'Kaithi'],
		['Tai_Tham', 'Tai_Tham'],
		['Lao', 'Lao'],
		['Latin', 'Latin'],
		['Lepcha', 'Lepcha'],
		['Limbu', 'Limbu'],
		['Linear_A', 'Linear_A'],
		['Linear_B', 'Linear_B'],
		['Lycian', 'Lycian'],
		['Lydian', 'Lydian'],
		['Mahajani', 'Mahajani'],
		['Makasar', 'Makasar'],
		['Mandaic', 'Mandaic'],
		['Manichaean', 'Manichaean'],
		['Marchen', 'Marchen'],
		['Medefaidrin', 'Medefaidrin'],
		['Mende_Kikakui', 'Mende_Kikakui'],
		['Meroitic_Cursive', 'Meroitic_Cursive'],
		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
		['Malayalam', 'Malayalam'],
		['Mongolian', 'Mongolian'],
		['Mro', 'Mro'],
		['Meetei_Mayek', 'Meetei_Mayek'],
		['Multani', 'Multani'],
		['Myanmar', 'Myanmar'],
		['Old_North_Arabian', 'Old_North_Arabian'],
		['Nabataean', 'Nabataean'],
		['Nko', 'Nko'],
		['Nushu', 'Nushu'],
		['Ogham', 'Ogham'],
		['Ol_Chiki', 'Ol_Chiki'],
		['Old_Turkic', 'Old_Turkic'],
		['Oriya', 'Oriya'],
		['Osage', 'Osage'],
		['Osmanya', 'Osmanya'],
		['Palmyrene', 'Palmyrene'],
		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
		['Old_Permic', 'Old_Permic'],
		['Phags_Pa', 'Phags_Pa'],
		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
		['Phoenician', 'Phoenician'],
		['Miao', 'Miao'],
		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
		['Rejang', 'Rejang'],
		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
		['Runic', 'Runic'],
		['Samaritan', 'Samaritan'],
		['Old_South_Arabian', 'Old_South_Arabian'],
		['Saurashtra', 'Saurashtra'],
		['SignWriting', 'SignWriting'],
		['Shavian', 'Shavian'],
		['Sharada', 'Sharada'],
		['Siddham', 'Siddham'],
		['Khudawadi', 'Khudawadi'],
		['Sinhala', 'Sinhala'],
		['Sogdian', 'Sogdian'],
		['Old_Sogdian', 'Old_Sogdian'],
		['Sora_Sompeng', 'Sora_Sompeng'],
		['Soyombo', 'Soyombo'],
		['Sundanese', 'Sundanese'],
		['Syloti_Nagri', 'Syloti_Nagri'],
		['Syriac', 'Syriac'],
		['Tagbanwa', 'Tagbanwa'],
		['Takri', 'Takri'],
		['Tai_Le', 'Tai_Le'],
		['New_Tai_Lue', 'New_Tai_Lue'],
		['Tamil', 'Tamil'],
		['Tangut', 'Tangut'],
		['Tai_Viet', 'Tai_Viet'],
		['Telugu', 'Telugu'],
		['Tifinagh', 'Tifinagh'],
		['Tagalog', 'Tagalog'],
		['Thaana', 'Thaana'],
		['Tibetan', 'Tibetan'],
		['Tirhuta', 'Tirhuta'],
		['Ugaritic', 'Ugaritic'],
		['Vai', 'Vai'],
		['Warang_Citi', 'Warang_Citi'],
		['Old_Persian', 'Old_Persian'],
		['Cuneiform', 'Cuneiform'],
		['Yi', 'Yi'],
		['Zanabazar_Square', 'Zanabazar_Square'],
		['Inherited', 'Inherited'],
		['Common', 'Common'],
		['Unknown', 'Unknown']
	])]
]);

const matchPropertyValue = function(property, value) {
	const aliasToValue = mappings.get(property);
	if (!aliasToValue) {
		throw new Error(`Unknown property \`${ property }\`.`);
	}
	const canonicalValue = aliasToValue.get(value);
	if (canonicalValue) {
		return canonicalValue;
	}
	throw new Error(
		`Unknown value \`${ value }\` for property \`${ property }\`.`
	);
};

var unicodeMatchPropertyValueEcmascript = matchPropertyValue;

var unicodeCanonicalPropertyNamesEcmascript = new Set([
	// Non-binary properties:
	'General_Category',
	'Script',
	'Script_Extensions',
	// Binary properties:
	'Alphabetic',
	'Any',
	'ASCII',
	'ASCII_Hex_Digit',
	'Assigned',
	'Bidi_Control',
	'Bidi_Mirrored',
	'Case_Ignorable',
	'Cased',
	'Changes_When_Casefolded',
	'Changes_When_Casemapped',
	'Changes_When_Lowercased',
	'Changes_When_NFKC_Casefolded',
	'Changes_When_Titlecased',
	'Changes_When_Uppercased',
	'Dash',
	'Default_Ignorable_Code_Point',
	'Deprecated',
	'Diacritic',
	'Emoji',
	'Emoji_Component',
	'Emoji_Modifier',
	'Emoji_Modifier_Base',
	'Emoji_Presentation',
	'Extended_Pictographic',
	'Extender',
	'Grapheme_Base',
	'Grapheme_Extend',
	'Hex_Digit',
	'ID_Continue',
	'ID_Start',
	'Ideographic',
	'IDS_Binary_Operator',
	'IDS_Trinary_Operator',
	'Join_Control',
	'Logical_Order_Exception',
	'Lowercase',
	'Math',
	'Noncharacter_Code_Point',
	'Pattern_Syntax',
	'Pattern_White_Space',
	'Quotation_Mark',
	'Radical',
	'Regional_Indicator',
	'Sentence_Terminal',
	'Soft_Dotted',
	'Terminal_Punctuation',
	'Unified_Ideograph',
	'Uppercase',
	'Variation_Selector',
	'White_Space',
	'XID_Continue',
	'XID_Start'
]);

// Generated using `npm run build`. Do not edit!
var unicodePropertyAliasesEcmascript = new Map([
	['scx', 'Script_Extensions'],
	['sc', 'Script'],
	['gc', 'General_Category'],
	['AHex', 'ASCII_Hex_Digit'],
	['Alpha', 'Alphabetic'],
	['Bidi_C', 'Bidi_Control'],
	['Bidi_M', 'Bidi_Mirrored'],
	['Cased', 'Cased'],
	['CI', 'Case_Ignorable'],
	['CWCF', 'Changes_When_Casefolded'],
	['CWCM', 'Changes_When_Casemapped'],
	['CWKCF', 'Changes_When_NFKC_Casefolded'],
	['CWL', 'Changes_When_Lowercased'],
	['CWT', 'Changes_When_Titlecased'],
	['CWU', 'Changes_When_Uppercased'],
	['Dash', 'Dash'],
	['Dep', 'Deprecated'],
	['DI', 'Default_Ignorable_Code_Point'],
	['Dia', 'Diacritic'],
	['Ext', 'Extender'],
	['Gr_Base', 'Grapheme_Base'],
	['Gr_Ext', 'Grapheme_Extend'],
	['Hex', 'Hex_Digit'],
	['IDC', 'ID_Continue'],
	['Ideo', 'Ideographic'],
	['IDS', 'ID_Start'],
	['IDSB', 'IDS_Binary_Operator'],
	['IDST', 'IDS_Trinary_Operator'],
	['Join_C', 'Join_Control'],
	['LOE', 'Logical_Order_Exception'],
	['Lower', 'Lowercase'],
	['Math', 'Math'],
	['NChar', 'Noncharacter_Code_Point'],
	['Pat_Syn', 'Pattern_Syntax'],
	['Pat_WS', 'Pattern_White_Space'],
	['QMark', 'Quotation_Mark'],
	['Radical', 'Radical'],
	['RI', 'Regional_Indicator'],
	['SD', 'Soft_Dotted'],
	['STerm', 'Sentence_Terminal'],
	['Term', 'Terminal_Punctuation'],
	['UIdeo', 'Unified_Ideograph'],
	['Upper', 'Uppercase'],
	['VS', 'Variation_Selector'],
	['WSpace', 'White_Space'],
	['space', 'White_Space'],
	['XIDC', 'XID_Continue'],
	['XIDS', 'XID_Start']
]);

const matchProperty = function(property) {
	if (unicodeCanonicalPropertyNamesEcmascript.has(property)) {
		return property;
	}
	if (unicodePropertyAliasesEcmascript.has(property)) {
		return unicodePropertyAliasesEcmascript.get(property);
	}
	throw new Error(`Unknown property: ${ property }`);
};

var unicodeMatchPropertyEcmascript = matchProperty;

var unicode = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Generated by shift-parser-js/scripts/generate-unicode-data.js

var whitespaceArray = exports.whitespaceArray = [5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8239, 8287, 12288, 65279];
var whitespaceBool = exports.whitespaceBool = [false, false, false, false, false, false, false, false, false, true, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

var idStartLargeRegex = exports.idStartLargeRegex = /^[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]$/;
var idStartBool = exports.idStartBool = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];

var idContinueLargeRegex = exports.idContinueLargeRegex = /^[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]$/;
var idContinueBool = exports.idContinueBool = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];
});

var dist = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright 2018 Shape Security, Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the "License")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

/* eslint-disable no-use-before-define */



var _unicodeMatchPropertyValueEcmascript2 = _interopRequireDefault(unicodeMatchPropertyValueEcmascript);



var _mappings2 = _interopRequireDefault(mappings);



var _unicodeMatchPropertyEcmascript2 = _interopRequireDefault(unicodeMatchPropertyEcmascript);



var _unicodePropertyAliasesEcmascript2 = _interopRequireDefault(unicodePropertyAliasesEcmascript);



function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var catchIsFalse = function catchIsFalse(predicate) {
  try {
    return !!predicate();
  } catch (e) {
    return false;
  }
};

var syntaxCharacters = '^$\\.*+?()[]{}|'.split('');
var extendedSyntaxCharacters = '^$\\.*+?()[|'.split('');

var controlEscapeCharacters = 'fnrtv'.split('');
var controlEscapeCharacterValues = { 'f': '\f'.charCodeAt(0), 'n': '\n'.charCodeAt(0), 'r': '\r'.charCodeAt(0), 't': '\t'.charCodeAt(0), 'v': '\v'.charCodeAt(0) };

var controlCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
var hexDigits = '0123456789abcdefABCDEF'.split('');
var decimalDigits = '0123456789'.split('');
var octalDigits = '01234567'.split('');

var INVALID_NAMED_BACKREFERENCE_SENTINEL = {};

function isIdentifierStart(ch) {
  return ch < 128 ? unicode.idStartBool[ch] : unicode.idStartLargeRegex.test(String.fromCodePoint(ch));
}

function isIdentifierPart(ch) {
  return ch < 128 ? unicode.idContinueBool[ch] : unicode.idContinueLargeRegex.test(String.fromCodePoint(ch));
}

var PatternAcceptorState = function () {
  function PatternAcceptorState(pattern, unicode) {
    _classCallCheck(this, PatternAcceptorState);

    this.pattern = pattern;
    this.unicode = unicode;
    this.index = 0;
    this.largestBackreference = 0;
    this.backreferenceNames = [];
    this.groupingNames = [];
    this.capturingGroups = 0;
  }

  _createClass(PatternAcceptorState, [{
    key: 'empty',
    value: function empty() {
      return this.index >= this.pattern.length;
    }
  }, {
    key: 'backreference',
    value: function backreference(ref) {
      if (ref > this.largestBackreference) {
        this.largestBackreference = ref;
      }
    }
  }, {
    key: 'nextCodePoint',
    value: function nextCodePoint() {
      if (this.empty()) {
        return null;
      }
      if (this.unicode) {
        return String.fromCodePoint(this.pattern.codePointAt(this.index));
      }
      return this.pattern.charAt(this.index);
    }
  }, {
    key: 'skipCodePoint',
    value: function skipCodePoint() {
      this.index += this.nextCodePoint().length;
    }
  }, {
    key: 'eat',
    value: function eat(str) {
      if (this.index + str.length > this.pattern.length || this.pattern.slice(this.index, this.index + str.length) !== str) {
        return false;
      }
      this.index += str.length;
      return true;
    }
  }, {
    key: 'eatIdentifierCodePoint',
    value: function eatIdentifierCodePoint() {
      var characterValue = void 0;
      var originalIndex = this.index;
      var character = void 0;
      if (this.match('\\u')) {
        this.skipCodePoint();
        characterValue = acceptUnicodeEscape(this);
        if (!characterValue.matched) {
          this.index = originalIndex;
          return null;
        }
        characterValue = characterValue.value;
        character = String.fromCodePoint(characterValue);
      } else {
        character = this.nextCodePoint();
        if (character == null) {
          this.index = originalIndex;
          return null;
        }
        this.index += character.length;
        characterValue = character.codePointAt(0);
      }
      return { character: character, characterValue: characterValue };
    }
  }, {
    key: 'eatIdentifierStart',
    value: function eatIdentifierStart() {
      var originalIndex = this.index;
      var codePoint = this.eatIdentifierCodePoint();
      if (codePoint === null) {
        this.index = originalIndex;
        return null;
      }
      if (codePoint.character === '_' || codePoint.character === '$' || isIdentifierStart(codePoint.characterValue)) {
        return codePoint.character;
      }
      this.index = originalIndex;
      return null;
    }
  }, {
    key: 'eatIdentifierPart',
    value: function eatIdentifierPart() {
      var originalIndex = this.index;
      var codePoint = this.eatIdentifierCodePoint();
      if (codePoint === null) {
        this.index = originalIndex;
        return null;
      }
      // ZWNJ / ZWJ
      if (codePoint.character === '\u200C' || codePoint.character === '\u200D' || codePoint.character === '$' || isIdentifierPart(codePoint.characterValue)) {
        return codePoint.character;
      }
      this.index = originalIndex;
      return null;
    }
  }, {
    key: 'eatAny',
    value: function eatAny() {
      for (var _len = arguments.length, strs = Array(_len), _key = 0; _key < _len; _key++) {
        strs[_key] = arguments[_key];
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = strs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var str = _step.value;

          if (this.eat(str)) {
            return str;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return null;
    }
  }, {
    key: 'match',
    value: function match(str) {
      return this.index + str.length <= this.pattern.length && this.pattern.slice(this.index, this.index + str.length) === str;
    }
  }, {
    key: 'matchAny',
    value: function matchAny() {
      for (var _len2 = arguments.length, strs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        strs[_key2] = arguments[_key2];
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = strs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var str = _step2.value;

          if (this.match(str)) {
            return true;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return false;
    }
  }, {
    key: 'eatNaturalNumber',
    value: function eatNaturalNumber() {
      var _this = this;

      var characters = [];
      var eatNumber = function eatNumber() {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = decimalDigits[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var str = _step3.value;

            if (_this.eat(str)) {
              characters.push(str);
              return true;
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        return false;
      };
      while (eatNumber()) {}
      return characters.length === 0 ? null : characters.join('');
    }
  }]);

  return PatternAcceptorState;
}();

// acceptRegex


exports.default = function (pattern) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$unicode = _ref.unicode,
      unicode = _ref$unicode === undefined ? false : _ref$unicode;

  var state = new PatternAcceptorState(pattern, unicode);
  var accepted = acceptDisjunction(state);
  if (accepted.matched) {
    if (state.unicode) {
      if (state.largestBackreference > state.capturingGroups) {
        return false;
      }
    }
    if (state.groupingNames.length > 0 || state.unicode) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = state.backreferenceNames[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var backreferenceName = _step4.value;

          if (state.groupingNames.indexOf(backreferenceName) === -1) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }
  return accepted.matched;
};

var backtrackOnFailure = function backtrackOnFailure(func) {
  return function (state) {
    var savedIndex = state.index;
    var oldBackreference = state.largestBackreference;
    var oldCapturingGroups = state.capturingGroups;
    var val = func(state);
    if (!val.matched) {
      state.index = savedIndex;
      state.largestBackreference = oldBackreference;
      state.capturingGroups = oldCapturingGroups;
    }
    return val;
  };
};

var acceptUnicodeEscape = backtrackOnFailure(function (state) {
  if (!state.eat('u')) {
    return { matched: false };
  }
  if (state.unicode && state.eat('{')) {
    var _digits = [];
    while (!state.eat('}')) {
      var digit = state.eatAny.apply(state, _toConsumableArray(hexDigits));
      if (digit === null) {
        return { matched: false };
      }
      _digits.push(digit);
    }
    var _value = parseInt(_digits.join(''), 16);
    return _value > 0x10FFFF ? { matched: false } : { matched: true, value: _value };
  }
  var digits = [0, 0, 0, 0].map(function () {
    return state.eatAny.apply(state, _toConsumableArray(hexDigits));
  });
  if (digits.some(function (digit) {
    return digit === null;
  })) {
    return { matched: false };
  }
  var value = parseInt(digits.join(''), 16);
  if (state.unicode && value >= 0xD800 && value <= 0xDBFF) {
    var surrogatePairValue = backtrackOnFailure(function (subState) {
      if (!subState.eat('\\u')) {
        return { matched: false };
      }
      var digits2 = [0, 0, 0, 0].map(function () {
        return subState.eatAny.apply(subState, _toConsumableArray(hexDigits));
      });
      if (digits2.some(function (digit) {
        return digit === null;
      })) {
        return { matched: false };
      }
      var value2 = parseInt(digits2.join(''), 16);
      if (value2 < 0xDC00 || value2 >= 0xE000) {
        return { matched: false };
      }
      return { matched: true, value: 0x10000 + ((value & 0x03FF) << 10) + (value2 & 0x03FF) };
    })(state);
    if (surrogatePairValue.matched) {
      return surrogatePairValue;
    }
  }
  return { matched: true, value: value };
});

var acceptDisjunction = function acceptDisjunction(state, terminator) {
  do {
    if (terminator !== void 0 && state.eat(terminator)) {
      return { matched: true };
    } else if (state.match('|')) {
      continue;
    }
    if (!acceptAlternative(state, terminator).matched) {
      return { matched: false };
    }
  } while (state.eat('|'));
  return { matched: terminator === void 0 || !!state.eat(terminator) };
};

var acceptAlternative = function acceptAlternative(state, terminator) {
  while (!state.match('|') && !state.empty() && (terminator === void 0 || !state.match(terminator))) {
    if (!acceptTerm(state).matched) {
      return { matched: false };
    }
  }
  return { matched: true };
};

var anyOf = function anyOf() {
  for (var _len3 = arguments.length, acceptors = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    acceptors[_key3] = arguments[_key3];
  }

  return function (state) {
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = acceptors[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var predicate = _step5.value;

        var value = predicate(state);
        if (value.matched) {
          return value;
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    return { matched: false };
  };
};

var acceptTerm = function acceptTerm(state) {
  // non-quantified references are rolled into quantified accepts to improve performance significantly.
  if (state.unicode) {
    return anyOf(acceptAssertion, acceptQuantified(acceptAtom))(state);
  }
  return anyOf(acceptQuantified(acceptQuantifiableAssertion), acceptAssertion, acceptQuantified(acceptAtom))(state);
};

var acceptLabeledGroup = function acceptLabeledGroup(predicate) {
  return backtrackOnFailure(function (state) {
    if (!state.eat('(')) {
      return { matched: false };
    }
    if (predicate(state)) {
      return acceptDisjunction(state, ')');
    }
    return { matched: false };
  });
};

var acceptQuantifiableAssertion = acceptLabeledGroup(function (state) {
  return !!state.eatAny('?=', '?!');
});

var acceptAssertion = function acceptAssertion(state) {
  if (state.eatAny('^', '$', '\\b', '\\B')) {
    return { matched: true };
  }
  return acceptLabeledGroup(function (subState) {
    return subState.unicode ? !!subState.eatAny('?=', '?!', '?<=', '?<!') : !!subState.eatAny('?<=', '?<!');
  })(state);
};

var acceptDecimal = function acceptDecimal(state) {
  return { matched: state.eatNaturalNumber() !== null };
};

var acceptQuantified = function acceptQuantified(acceptor) {
  return backtrackOnFailure(function (state) {
    if (!acceptor(state).matched) {
      return { matched: false };
    }
    if (state.match('{')) {
      var value = backtrackOnFailure(function (subState) {
        subState.eat('{');
        var num1 = subState.eatNaturalNumber();
        if (num1 === null) {
          return { matched: false };
        }
        if (subState.eat(',') && subState.matchAny.apply(subState, _toConsumableArray(decimalDigits))) {
          var num2 = subState.eatNaturalNumber();
          if (num2 === null || parseInt(num1) > parseInt(num2)) {
            return { matched: false };
          }
        }
        if (!subState.eat('}')) {
          return { matched: false };
        }
        subState.eat('?');
        return { matched: true };
      })(state);
      if (!value.matched) {
        return { matched: !state.unicode };
      }
      return value;
    } else if (state.eatAny('*', '+', '?')) {
      state.eat('?');
    }
    return { matched: true };
  });
};

var acceptCharacterExcept = function acceptCharacterExcept(characters) {
  return function (state) {
    var nextCodePoint = state.nextCodePoint();
    if (nextCodePoint === null || characters.indexOf(nextCodePoint) !== -1) {
      return { matched: false };
    }
    state.skipCodePoint();
    return { matched: true };
  };
};

var acceptPatternCharacter = acceptCharacterExcept(syntaxCharacters);

var acceptExtendedPatternCharacter = acceptCharacterExcept(extendedSyntaxCharacters);

var acceptInvalidBracedQuantifier = function acceptInvalidBracedQuantifier(state) {
  return backtrackOnFailure(function (subState) {
    return { matched: !!(subState.eat('{') && acceptDecimal(subState).matched && (!subState.eat(',') || subState.match('}') || acceptDecimal(subState).matched) && subState.eat('}')) };
  })(state);
};

var acceptAtom = function acceptAtom(state) {
  if (state.unicode) {
    return anyOf(acceptPatternCharacter, function (subState) {
      return { matched: !!subState.eat('.') };
    }, backtrackOnFailure(function (subState) {
      return subState.eat('\\') ? acceptAtomEscape(subState) : { matched: false };
    }), acceptCharacterClass, acceptLabeledGroup(function (subState) {
      return subState.eat('?:');
    }), acceptGrouping)(state);
  }
  var matched = anyOf(function (subState) {
    return { matched: !!subState.eat('.') };
  }, backtrackOnFailure(function (subState) {
    return subState.eat('\\') ? acceptAtomEscape(subState) : { matched: false };
  }), backtrackOnFailure(function (subState) {
    return { matched: subState.eat('\\') && subState.match('c') };
  }), acceptCharacterClass, acceptLabeledGroup(function (subState) {
    return subState.eat('?:');
  }), acceptGrouping)(state);
  if (!matched.matched && acceptInvalidBracedQuantifier(state).matched) {
    return { matched: false };
  }
  return matched.matched ? matched : acceptExtendedPatternCharacter(state);
};

var acceptGrouping = backtrackOnFailure(function (state) {
  if (!state.eat('(')) {
    return { matched: false };
  }
  var groupName = backtrackOnFailure(function (subState) {
    if (!state.eat('?')) {
      return { matched: false };
    }
    return acceptGroupName(subState);
  })(state);
  if (!acceptDisjunction(state, ')').matched) {
    return { matched: false };
  }
  if (groupName.matched) {
    if (state.groupingNames.indexOf(groupName.data) !== -1) {
      return { matched: false };
    }
    state.groupingNames.push(groupName.data);
  }
  state.capturingGroups++;
  return { matched: true };
});

var acceptDecimalEscape = backtrackOnFailure(function (state) {
  var firstDecimal = state.eatAny.apply(state, _toConsumableArray(decimalDigits));
  if (firstDecimal === null) {
    return { matched: false };
  }
  if (firstDecimal === '0') {
    return { matched: true };
  }
  // we also accept octal escapes here, but it is impossible to tell if it is a octal escape until all parsing is complete.
  // octal escapes are handled in acceptCharacterEscape for classes
  state.backreference(parseInt(firstDecimal + (state.eatNaturalNumber() || '')));
  return { matched: true };
});

var acceptCharacterClassEscape = function acceptCharacterClassEscape(state) {
  if (state.eatAny('d', 'D', 's', 'S', 'w', 'W')) {
    return { matched: true };
  }
  if (state.unicode) {
    return backtrackOnFailure(function (subState) {
      if (!subState.eat('p{') && !subState.eat('P{')) {
        return { matched: false };
      }
      if (!acceptUnicodePropertyValueExpression(subState).matched) {
        return { matched: false };
      }
      return { matched: !!subState.eat('}') };
    })(state);
  }
  return { matched: false };
};

var acceptUnicodePropertyName = function acceptUnicodePropertyName(state) {
  var characters = [];
  var character = void 0;
  while (character = state.eatAny.apply(state, _toConsumableArray(controlCharacters).concat(['_']))) {
    // eslint-disable-line no-cond-assign
    characters.push(character);
  }
  return { matched: characters.length > 0, data: characters.join('') };
};

var acceptUnicodePropertyValue = function acceptUnicodePropertyValue(state) {
  var characters = [];
  var character = void 0;
  while (character = state.eatAny.apply(state, _toConsumableArray(controlCharacters).concat(_toConsumableArray(decimalDigits), ['_']))) {
    // eslint-disable-line no-cond-assign
    characters.push(character);
  }
  return { matched: characters.length > 0, data: characters.join('') };
};

// excluding nonbinary properties from mathias' list
// https://www.ecma-international.org/ecma-262/9.0/index.html#table-nonbinary-unicode-properties
var illegalLoneUnicodePropertyNames = ['General_Category', 'Script', 'Script_Extensions', 'scx', 'sc', 'gc'];

var generalCategoryValues = _mappings2.default.get('General_Category');

var acceptLoneUnicodePropertyNameOrValue = function acceptLoneUnicodePropertyNameOrValue(state) {
  var loneValue = acceptUnicodePropertyValue(state);
  if (!loneValue.matched || illegalLoneUnicodePropertyNames.includes(loneValue.data)) {
    return { matched: false };
  }

  return { matched: catchIsFalse(function () {
      return (0, _unicodeMatchPropertyEcmascript2.default)(loneValue.data);
    }) || generalCategoryValues.get(loneValue.data) != null };
};

var acceptUnicodePropertyValueExpression = function acceptUnicodePropertyValueExpression(state) {
  return anyOf(backtrackOnFailure(function (subState) {
    var name = acceptUnicodePropertyName(subState);
    if (!name.matched || !subState.eat('=')) {
      return { matched: false };
    }
    var value = acceptUnicodePropertyValue(subState);
    if (!value.matched) {
      return { matched: false };
    }
    return { matched: catchIsFalse(function () {
        return (0, _unicodeMatchPropertyValueEcmascript2.default)(_unicodePropertyAliasesEcmascript2.default.get(name.data) || name.data, value.data);
      }) };
  }), backtrackOnFailure(acceptLoneUnicodePropertyNameOrValue))(state);
};

var acceptCharacterEscape = anyOf(function (state) {
  var eaten = state.eatAny.apply(state, _toConsumableArray(controlEscapeCharacters));
  if (eaten === null) {
    return { matched: false };
  }
  return { matched: true, value: controlEscapeCharacterValues[eaten] };
}, backtrackOnFailure(function (state) {
  if (!state.eat('c')) {
    return { matched: false };
  }
  var character = state.eatAny.apply(state, _toConsumableArray(controlCharacters));
  if (character === null) {
    return { matched: false };
  }
  return { matched: true, value: character.charCodeAt(0) % 32 };
}), backtrackOnFailure(function (state) {
  if (!state.eat('0') || state.eatAny.apply(state, _toConsumableArray(decimalDigits))) {
    return { matched: false };
  }
  return { matched: true, value: 0 };
}), backtrackOnFailure(function (state) {
  if (!state.eat('x')) {
    return { matched: false };
  }
  var digits = [0, 0].map(function () {
    return state.eatAny.apply(state, _toConsumableArray(hexDigits));
  });
  if (digits.some(function (value) {
    return value === null;
  })) {
    return { matched: false };
  }
  return { matched: true, value: parseInt(digits.join(''), 16) };
}), acceptUnicodeEscape, backtrackOnFailure(function (state) {
  if (state.unicode) {
    return { matched: false };
  }
  var octal1 = state.eatAny.apply(state, _toConsumableArray(octalDigits));
  if (octal1 === null) {
    return { matched: false };
  }
  var octal1Value = parseInt(octal1, 8);
  if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
    return { matched: true, value: octal1Value };
  }
  var octal2 = state.eatAny.apply(state, _toConsumableArray(octalDigits));
  var octal2Value = parseInt(octal2, 8);
  if (octal1Value < 4) {
    if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
      return { matched: true, value: octal1Value << 3 | octal2Value };
    }
    var octal3 = state.eatAny.apply(state, _toConsumableArray(octalDigits));
    var octal3Value = parseInt(octal3, 8);
    return { matched: true, value: octal1Value << 6 | octal2Value << 3 | octal3Value };
  }
  return { matched: true, value: octal1Value << 3 | octal2Value };
}), backtrackOnFailure(function (state) {
  if (!state.unicode) {
    return { matched: false };
  }
  var value = state.eatAny.apply(state, _toConsumableArray(syntaxCharacters));
  if (value === null) {
    return { matched: false };
  }
  return { matched: true, value: value.charCodeAt(0) };
}), function (state) {
  if (!state.unicode || !state.eat('/')) {
    return { matched: false };
  }
  return { matched: true, value: '/'.charCodeAt(0) };
}, backtrackOnFailure(function (state) {
  if (state.unicode) {
    return { matched: false };
  }
  var next = state.nextCodePoint();
  if (next !== null && next !== 'c' && next !== 'k') {
    state.skipCodePoint();
    return { matched: true, value: next.codePointAt(0) };
  }
  return { matched: false };
}));

var acceptGroupNameBackreference = backtrackOnFailure(function (state) {
  if (!state.eat('k')) {
    return { matched: false };
  }
  var name = acceptGroupName(state);
  if (!name.matched) {
    state.backreferenceNames.push(INVALID_NAMED_BACKREFERENCE_SENTINEL);
    return { matched: true };
  }
  state.backreferenceNames.push(name.data);
  return { matched: true };
});

var acceptGroupName = backtrackOnFailure(function (state) {
  if (!state.eat('<')) {
    return { matched: false };
  }
  var characters = [];
  var start = state.eatIdentifierStart();
  if (!start) {
    return { matched: false };
  }
  characters.push(start);
  var part = void 0;
  while (part = state.eatIdentifierPart()) {
    // eslint-disable-line no-cond-assign
    characters.push(part);
  }
  if (!state.eat('>')) {
    return { matched: false };
  }
  return { matched: characters.length > 0, data: characters.join('') };
});

var acceptAtomEscape = anyOf(acceptDecimalEscape, acceptCharacterClassEscape, acceptCharacterEscape, acceptGroupNameBackreference);

var acceptCharacterClass = backtrackOnFailure(function (state) {
  if (!state.eat('[')) {
    return { matched: false };
  }
  state.eat('^');

  var acceptClassEscape = anyOf(function (subState) {
    return { matched: !!subState.eat('b'), value: 0x0008 };
  }, function (subState) {
    return { matched: subState.unicode && !!subState.eat('-'), value: '-'.charCodeAt(0) };
  }, backtrackOnFailure(function (subState) {
    if (subState.unicode || !subState.eat('c')) {
      return { matched: false };
    }
    var character = subState.eatAny.apply(subState, _toConsumableArray(decimalDigits).concat(['_']));
    if (character === null) {
      return { matched: false };
    }
    return { matched: true, value: character.charCodeAt(0) % 32 };
  }), acceptCharacterClassEscape, acceptCharacterEscape,
  // We special-case `\k` because `acceptCharacterEscape` rejects `\k` unconditionally,
  // deferring `\k` to acceptGroupNameBackreference, which is not called here.
  // See also https://github.com/tc39/ecma262/issues/2037. This code takes the route of
  // making it unconditionally legal, rather than legal only in the absence of a group name.
  function (subState) {
    return { matched: !subState.unicode && !!subState.eat('k'), value: 107 };
  });

  var acceptClassAtomNoDash = function acceptClassAtomNoDash(localState) {
    var nextCodePoint = localState.nextCodePoint();
    if (nextCodePoint === ']' || nextCodePoint === '-' || nextCodePoint === null) {
      return { matched: false };
    }
    if (nextCodePoint !== '\\') {
      localState.skipCodePoint();
      return { matched: true, value: nextCodePoint.codePointAt(0) };
    }
    localState.eat('\\');
    var classEscape = acceptClassEscape(localState);
    if (!classEscape.matched && localState.nextCodePoint() === 'c' && !localState.unicode) {
      return { matched: true, value: '\\'.charCodeAt(0) };
    }
    return classEscape;
  };

  var acceptClassAtom = function acceptClassAtom(localState) {
    if (localState.eat('-')) {
      return { matched: true, value: '-'.charCodeAt(0) };
    }
    return acceptClassAtomNoDash(localState);
  };

  var finishClassRange = function finishClassRange(localState, atom) {
    var isUnvaluedPassedAtom = function isUnvaluedPassedAtom(subAtom) {
      return subAtom.value === void 0 && subAtom.matched;
    };
    if (localState.eat('-')) {
      if (localState.match(']')) {
        return { matched: true };
      }
      var otherAtom = acceptClassAtom(localState);
      if (!otherAtom.matched) {
        return { matched: false };
      }
      if (localState.unicode && (isUnvaluedPassedAtom(atom) || isUnvaluedPassedAtom(otherAtom))) {
        return { matched: false };
      } else if (!(!localState.unicode && (isUnvaluedPassedAtom(atom) || isUnvaluedPassedAtom(otherAtom))) && atom.value > otherAtom.value) {
        return { matched: false };
      } else if (localState.match(']')) {
        return { matched: true };
      }
      return acceptNonEmptyClassRanges(localState);
    }
    if (localState.match(']')) {
      return { matched: true };
    }
    return acceptNonEmptyClassRangesNoDash(localState);
  };

  var acceptNonEmptyClassRanges = function acceptNonEmptyClassRanges(localState) {
    var atom = acceptClassAtom(localState);
    return atom.matched ? finishClassRange(localState, atom) : { matched: false };
  };

  var acceptNonEmptyClassRangesNoDash = function acceptNonEmptyClassRangesNoDash(localState) {
    var atom = acceptClassAtomNoDash(localState);
    return atom.matched ? finishClassRange(localState, atom) : { matched: false };
  };

  if (state.eat(']')) {
    return { matched: true };
  }

  var value = acceptNonEmptyClassRanges(state);
  if (value.matched) {
    state.eat(']'); // cannot fail, as above will not return matched if it is not seen in advance
  }

  return value;
});
});

var __pika_web_default_export_for_treeshaking__ = /*@__PURE__*/getDefaultExportFromCjs(dist);

export default __pika_web_default_export_for_treeshaking__;
