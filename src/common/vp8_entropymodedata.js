'use strict';

//kf_b_mode_probs
var vp8_kf_bmode_prob  =
        [
            [/* above mode 0 */
                new Uint8Array([/* left mode 0 */ 231, 120, 48, 89, 115, 113, 120, 152, 112]),
                new Uint8Array([/* left mode 1 */ 152, 179, 64, 126, 170, 118, 46, 70, 95]),
                new Uint8Array([/* left mode 2 */ 175, 69, 143, 80, 85, 82, 72, 155, 103]),
                new Uint8Array([/* left mode 3 */ 56, 58, 10, 171, 218, 189, 17, 13, 152]),
                new Uint8Array([/* left mode 4 */ 144, 71, 10, 38, 171, 213, 144, 34, 26]),
                new Uint8Array([/* left mode 5 */ 114, 26, 17, 163, 44, 195, 21, 10, 173]),
                new Uint8Array([/* left mode 6 */ 121, 24, 80, 195, 26, 62, 44, 64, 85]),
                new Uint8Array([/* left mode 7 */ 170, 46, 55, 19, 136, 160, 33, 206, 71]),
                new Uint8Array([/* left mode 8 */ 63, 20, 8, 114, 114, 208, 12, 9, 226]),
                new Uint8Array([/* left mode 9 */ 81, 40, 11, 96, 182, 84, 29, 16, 36])
            ],
            [/* above mode 1 */
                new Uint8Array([/* left mode 0 */ 134, 183, 89, 137, 98, 101, 106, 165, 148]),
                new Uint8Array([/* left mode 1 */ 72, 187, 100, 130, 157, 111, 32, 75, 80]),
                new Uint8Array([/* left mode 2 */ 66, 102, 167, 99, 74, 62, 40, 234, 128]),
                new Uint8Array([/* left mode 3 */ 41, 53, 9, 178, 241, 141, 26, 8, 107]),
                new Uint8Array([/* left mode 4 */ 104, 79, 12, 27, 217, 255, 87, 17, 7]),
                new Uint8Array([/* left mode 5 */ 74, 43, 26, 146, 73, 166, 49, 23, 157]),
                new Uint8Array([/* left mode 6 */ 65, 38, 105, 160, 51, 52, 31, 115, 128]),
                new Uint8Array([/* left mode 7 */ 87, 68, 71, 44, 114, 51, 15, 186, 23]),
                new Uint8Array([/* left mode 8 */ 47, 41, 14, 110, 182, 183, 21, 17, 194]),
                new Uint8Array([/* left mode 9 */ 66, 45, 25, 102, 197, 189, 23, 18, 22])
            ],
            [/* above mode 2 */
                new Uint8Array([/* left mode 0 */ 88, 88, 147, 150, 42, 46, 45, 196, 205]),
                new Uint8Array([/* left mode 1 */ 43, 97, 183, 117, 85, 38, 35, 179, 61]),
                new Uint8Array([/* left mode 2 */ 39, 53, 200, 87, 26, 21, 43, 232, 171]),
                new Uint8Array([/* left mode 3 */ 56, 34, 51, 104, 114, 102, 29, 93, 77]),
                new Uint8Array([/* left mode 4 */ 107, 54, 32, 26, 51, 1, 81, 43, 31]),
                new Uint8Array([/* left mode 5 */ 39, 28, 85, 171, 58, 165, 90, 98, 64]),
                new Uint8Array([/* left mode 6 */ 34, 22, 116, 206, 23, 34, 43, 166, 73]),
                new Uint8Array([/* left mode 7 */ 68, 25, 106, 22, 64, 171, 36, 225, 114]),
                new Uint8Array([/* left mode 8 */ 34, 19, 21, 102, 132, 188, 16, 76, 124]),
                new Uint8Array([/* left mode 9 */ 62, 18, 78, 95, 85, 57, 50, 48, 51])
            ],
            [/* above mode 3 */
                new Uint8Array([/* left mode 0 */ 193, 101, 35, 159, 215, 111, 89, 46, 111]),
                new Uint8Array([/* left mode 1 */ 60, 148, 31, 172, 219, 228, 21, 18, 111]),
                new Uint8Array([/* left mode 2 */ 112, 113, 77, 85, 179, 255, 38, 120, 114]),
                new Uint8Array([/* left mode 3 */ 40, 42, 1, 196, 245, 209, 10, 25, 109]),
                new Uint8Array([/* left mode 4 */ 100, 80, 8, 43, 154, 1, 51, 26, 71]),
                new Uint8Array([/* left mode 5 */ 88, 43, 29, 140, 166, 213, 37, 43, 154]),
                new Uint8Array([/* left mode 6 */ 61, 63, 30, 155, 67, 45, 68, 1, 209]),
                new Uint8Array([/* left mode 7 */ 142, 78, 78, 16, 255, 128, 34, 197, 171]),
                new Uint8Array([/* left mode 8 */ 41, 40, 5, 102, 211, 183, 4, 1, 221]),
                new Uint8Array([/* left mode 9 */ 51, 50, 17, 168, 209, 192, 23, 25, 82])
            ],
            [/* above mode 4 */
                new Uint8Array([/* left mode 0 */ 125, 98, 42, 88, 104, 85, 117, 175, 82]),
                new Uint8Array([/* left mode 1 */ 95, 84, 53, 89, 128, 100, 113, 101, 45]),
                new Uint8Array([/* left mode 2 */ 75, 79, 123, 47, 51, 128, 81, 171, 1]),
                new Uint8Array([/* left mode 3 */ 57, 17, 5, 71, 102, 57, 53, 41, 49]),
                new Uint8Array([/* left mode 4 */ 115, 21, 2, 10, 102, 255, 166, 23, 6]),
                new Uint8Array([/* left mode 5 */ 38, 33, 13, 121, 57, 73, 26, 1, 85]),
                new Uint8Array([/* left mode 6 */ 41, 10, 67, 138, 77, 110, 90, 47, 114]),
                new Uint8Array([/* left mode 7 */ 101, 29, 16, 10, 85, 128, 101, 196, 26]),
                new Uint8Array([/* left mode 8 */ 57, 18, 10, 102, 102, 213, 34, 20, 43]),
                new Uint8Array([/* left mode 9 */ 117, 20, 15, 36, 163, 128, 68, 1, 26])
            ],
            [/* above mode 5 */
                new Uint8Array([/* left mode 0 */ 138, 31, 36, 171, 27, 166, 38, 44, 229]),
                new Uint8Array([/* left mode 1 */ 67, 87, 58, 169, 82, 115, 26, 59, 179]),
                new Uint8Array([/* left mode 2 */ 63, 59, 90, 180, 59, 166, 93, 73, 154]),
                new Uint8Array([/* left mode 3 */ 40, 40, 21, 116, 143, 209, 34, 39, 175]),
                new Uint8Array([/* left mode 4 */ 57, 46, 22, 24, 128, 1, 54, 17, 37]),
                new Uint8Array([/* left mode 5 */ 47, 15, 16, 183, 34, 223, 49, 45, 183]),
                new Uint8Array([/* left mode 6 */ 46, 17, 33, 183, 6, 98, 15, 32, 183]),
                new Uint8Array([/* left mode 7 */ 65, 32, 73, 115, 28, 128, 23, 128, 205]),
                new Uint8Array([/* left mode 8 */ 40, 3, 9, 115, 51, 192, 18, 6, 223]),
                new Uint8Array([/* left mode 9 */ 87, 37, 9, 115, 59, 77, 64, 21, 47])
            ],
            [/* above mode 6 */
                new Uint8Array([/* left mode 0 */ 104, 55, 44, 218, 9, 54, 53, 130, 226]),
                new Uint8Array([/* left mode 1 */ 64, 90, 70, 205, 40, 41, 23, 26, 57]),
                new Uint8Array([/* left mode 2 */ 54, 57, 112, 184, 5, 41, 38, 166, 213]),
                new Uint8Array([/* left mode 3 */ 30, 34, 26, 133, 152, 116, 10, 32, 134]),
                new Uint8Array([/* left mode 4 */ 75, 32, 12, 51, 192, 255, 160, 43, 51]),
                new Uint8Array([/* left mode 5 */ 39, 19, 53, 221, 26, 114, 32, 73, 255]),
                new Uint8Array([/* left mode 6 */ 31, 9, 65, 234, 2, 15, 1, 118, 73]),
                new Uint8Array([/* left mode 7 */ 88, 31, 35, 67, 102, 85, 55, 186, 85]),
                new Uint8Array([/* left mode 8 */ 56, 21, 23, 111, 59, 205, 45, 37, 192]),
                new Uint8Array([/* left mode 9 */ 55, 38, 70, 124, 73, 102, 1, 34, 98])
            ],
            [/* above mode 7 */
                new Uint8Array([/* left mode 0 */ 102, 61, 71, 37, 34, 53, 31, 243, 192]),
                new Uint8Array([/* left mode 1 */ 69, 60, 71, 38, 73, 119, 28, 222, 37]),
                new Uint8Array([/* left mode 2 */ 68, 45, 128, 34, 1, 47, 11, 245, 171]),
                new Uint8Array([/* left mode 3 */ 62, 17, 19, 70, 146, 85, 55, 62, 70]),
                new Uint8Array([/* left mode 4 */ 75, 15, 9, 9, 64, 255, 184, 119, 16]),
                new Uint8Array([/* left mode 5 */ 37, 43, 37, 154, 100, 163, 85, 160, 1]),
                new Uint8Array([/* left mode 6 */ 63, 9, 92, 136, 28, 64, 32, 201, 85]),
                new Uint8Array([/* left mode 7 */ 86, 6, 28, 5, 64, 255, 25, 248, 1]),
                new Uint8Array([/* left mode 8 */ 56, 8, 17, 132, 137, 255, 55, 116, 128]),
                new Uint8Array([/* left mode 9 */ 58, 15, 20, 82, 135, 57, 26, 121, 40])
            ],
            [/* above mode 8 */
                new Uint8Array([/* left mode 0 */ 164, 50, 31, 137, 154, 133, 25, 35, 218]),
                new Uint8Array([/* left mode 1 */ 51, 103, 44, 131, 131, 123, 31, 6, 158]),
                new Uint8Array([/* left mode 2 */ 86, 40, 64, 135, 148, 224, 45, 183, 128]),
                new Uint8Array([/* left mode 3 */ 22, 26, 17, 131, 240, 154, 14, 1, 209]),
                new Uint8Array([/* left mode 4 */ 83, 12, 13, 54, 192, 255, 68, 47, 28]),
                new Uint8Array([/* left mode 5 */ 45, 16, 21, 91, 64, 222, 7, 1, 197]),
                new Uint8Array([/* left mode 6 */ 56, 21, 39, 155, 60, 138, 23, 102, 213]),
                new Uint8Array([/* left mode 7 */ 85, 26, 85, 85, 128, 128, 32, 146, 171]),
                new Uint8Array([/* left mode 8 */ 18, 11, 7, 63, 144, 171, 4, 4, 246]),
                new Uint8Array([/* left mode 9 */ 35, 27, 10, 146, 174, 171, 12, 26, 128])
            ],
            [/* above mode 9 */
                new Uint8Array([/* left mode 0 */ 190, 80, 35, 99, 180, 80, 126, 54, 45]),
                new Uint8Array([/* left mode 1 */ 85, 126, 47, 87, 176, 51, 41, 20, 32]),
                new Uint8Array([/* left mode 2 */ 101, 75, 128, 139, 118, 146, 116, 128, 85]),
                new Uint8Array([/* left mode 3 */ 56, 41, 15, 176, 236, 85, 37, 9, 62]),
                new Uint8Array([/* left mode 4 */ 146, 36, 19, 30, 171, 255, 97, 27, 20]),
                new Uint8Array([/* left mode 5 */ 71, 30, 17, 119, 118, 255, 17, 18, 138]),
                new Uint8Array([/* left mode 6 */ 101, 38, 60, 138, 55, 70, 43, 26, 142]),
                new Uint8Array([/* left mode 7 */ 138, 45, 61, 62, 219, 1, 81, 188, 64]),
                new Uint8Array([/* left mode 8 */ 32, 41, 20, 117, 151, 142, 20, 21, 163]),
                new Uint8Array([/* left mode 9 */ 112, 19, 12, 61, 195, 128, 48, 4, 24])
            ]
        ];

module.exports = {};
module.exports.vp8_kf_bmode_prob = vp8_kf_bmode_prob;