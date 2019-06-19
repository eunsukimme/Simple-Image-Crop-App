# React와 react-image-crop 을 활용한 이미지 크롭 과정

먼저, 이미지를 크롭하는 다음과 같은 프로세스를 가정하였다

1. 사용자가 이미지를 업로드한다(영수증, 사진 등)
2. 사용자가 업로드한 이미지를 편집(크롭)한다
3. 사용자가 편집한 이미지를 서버에 전송한다

이를 구현하기 위해 리액트와 리액트 전용 이미지 크롭 라이브러리인 `react-image-crop` 을 활용하였다

전체 소스코드는 아래 링크에서 확인할 수 있다

<https://github.com/eunsukimme/simple-image-crop-app>

## Preview

필자가 구현하고자 한 페이지는 다음과 같은 `JSX`로 작성되었다. `JSX`는 HTML과 유사하지만, JS의 확장 문법이다. 낯설다면 HTML 생각하면 편할 것이다

```jsx
<div className="App">
  <div>
    <input type="file" onChange={this.onSelectFile} />
  </div>
  {src && (
    <ReactCrop
      src={src}
      crop={crop}
      onImageLoaded={this.onImageLoaded}
      onComplete={this.onCropComplete}
      onChange={this.onCropChange}
    />
  )}
  {croppedImageUrl && (
    <img alt="Crop" style={{ maxWidth: "100%" }} src={croppedImageUrl} />
  )}
</div>
```

먼저 제일 최상위 `div` 태그를 만들고, 그 아래에 크게 3가지 영역으로 나누었다

1. 파일을 선택하는 input 태그 영역
2. 선택된 파일을 편집(크롭)하는 영역
3. 편집된 이미지를 보여주는 영역

그런 다음, 리액트 컴포넌트의 상태(state)를 정의하였다

```js
state = {
  src: null, // 업로드할 image의 src
  crop: {
    // 크롭(편집)할 이미지의 정보
    unit: "px"
  }
};
```

상태는 크게 두 가지로, 이미지의 경로인 src 와 편집할 이미지의 정보를 담을 crop 이다. 자, 이제 본격적으로 이를 구현하는 과정을 자세히 들여다 보자

## 1. 사용자가 이미지를 업로드한다

HTML5 에서는 FileAPI 를 제공한다. FileReader 로 이미지를 쉽게 업로드하고 이를 읽어들일 수 있다

```javascript
onSelectFile = e => {
  // 파일이 등록되면
  if (e.target.files && e.target.files.length > 0) {
    // HTML5 의 FileAPI 를 사용한다
    // FileReader 객체를 reader 에 저장
    const reader = new FileReader();

    // readAsDataURL로 파일을 읽는다
    reader.readAsDataURL(e.target.files[0]);

    // readAsDataURL 메서드 실행이 완료되면 onload 이벤트가 발생한다
    // 이 이벤트가 발생하면(읽기가 완료되면) 해당 이미지를 src state에 저장한다
    reader.addEventListener("load", () => {
      this.setState({ src: reader.result });
    });
  }
};
```

파일을 등록하는 `input` 태그에 `onChange` 이벤트 리스너 함수인 `onSelectFile` 을 작성하여서 파일의 변화를 캐치하도록 하였다. `e`는 바로 이러한 이벤트를 캐치하는 파라미터 이다. 일단 사용자가 파일을 등록하면, FileReader 객체를 생성하여 `reader`에 할당한 후 `readAsDataURL`로 파일을 읽어들인다

여기서 `readAsDataURL` 메서드는 이미지를 DataURI 로 읽어들인다. DataURI 는 RFC 2397에 정의되어 있는 방법으로 이미지와 같은 데이터를 `data:image/png;base64,iVBORw....` 형태로된 URI 로 표현하는 방식이다 실제로 이미지 링크 대신 src 속성에 DataURI를 넣으면 이미지가 표시된다

이어서 살펴보면, `readAsDataURL` 메서드의 실행이 완료되어 파일의 읽기가 완료되면, `onload` 이벤트가 발생한다. 해당 이벤트 리스너를 `reader` 객체에 저장하여 완료된 결과를 `src` state에 저장하도록 하였다

## 2. 사용자가 업로드한 이미지를 편집(크롭)한다

사용자가 업로드한 이미지를 직접 크롭할 수 있게 하기위해 먼저 원본 이미지를 화면에 나타내고, 그 위에 크롭하는 이미지를 나타낼 것이다

```jsx
{
  src && (
    <ReactCrop
      src={src}
      crop={crop}
      onImageLoaded={this.onImageLoaded}
      onComplete={this.onCropComplete}
      onChange={this.onCropChange}
    />
  );
}
```

현재 state의 `src` 가 null이 아닌 등록한 이미지의 DataURI 이면, 즉 이미지가 등록되면`ReactCrop` 컴포넌트가 렌더링 되게 하였다. 컴포넌트의 prop으로 `src` 와 `crop` 은 현재 state의 것들을 넘겨주었다. 다음으로 세 가지 이벤트를 감지하여 이를 핸들링하는 콜백 함수를 작성하였다

먼저, 이미지가 로드가 완료되었을 때 호출되는 `onImageLoaded()` 라는 콜백 함수를 작성하였다. 로드된 이미지를 파라미터로 받아 이를 `ref`로 만들어서 나중에 접근하기 쉽도록 하였다

```js
onImageLoaded = image => {
  this.imageRef = image;
};
```

그런 다음, 이미지 크롭 중(마우스 드래그 중) 발생하는 이벤트를 감지하여 `crop` 오브젝트를 업데이트 시켜주는 `onCropChange()` 라는 콜백 함수를 작성하였다

```js
onCropChange = (crop, percentCrop) => {
  // 퍼센트 크롭을 사용해도 된다:
  //this.setState({ crop: percentCrop });
  this.setState({ crop });
};
```

마지막으로, 크롭이 완료되면(마우스 드래그가 끝나면) 해당 영역을 보여주는 `onCropComplete()` 라는 콜백 함수를 작성하였다

```js
onCropComplete = (crop, percentCrop) => {
  this.makeClientCrop(crop);
};
```

여기에서 호출하는 `makeClientCrop()` 이 바로 주어진 `crop`을 파라미터로 받아서 캔버스에 그리는 기능을 한다. `makeClientCrop()` 함수의 내용은 다음과 같다

```js
async makeClientCrop(crop) {
    if (this.imageRef && crop.width && crop.height) {
      // getCroppedImg() 메서드 호출한 결과값을
      // state에 반영한다
      const croppedImageUrl = await this.getCroppedImg(
        this.imageRef,
        crop,
        "newFile.jpeg"
      );
      this.setState({ croppedImageUrl });
    }
  }
```

이 함수에서 또 `getCroppedImg()` 라는 함수를 호출하였는데, 이 함수는 파라미터로 주어진 `this.imageRef` 와 `crop`, 파일 이름(`newFile.jpeg`) 을 받아서 크롭한 영역의 이미지를 전달한다. `makeClientCrop()` 함수는 최종적으로 `croppedImageUrl` 변수를 state에 저장하여 이를 갖고 나중에 화면에 크롭한 이미지를 렌더링할 수 있게 만든다

자, 이제 `getCroppedImg()` 메서드를 살펴보도록 하자

```js
getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement("canvas"); // document 상에 canvas 태그 생성
    // 캔버스 영역을 크롭한 이미지 크기 만큼 조절
    canvas.width = crop.width;
    canvas.height = crop.height;
    // getContext() 메서드를 활용하여 캔버스 렌더링 컨텍스트 함수 사용
    // 이 경우 drawImage() 메서드를 활용하여 이미지를 그린다
    const ctx = canvas.getContext("2d");

    // 화면에 크롭된 이미지를 그린다
    ctx.drawImage(
      // 원본 이미지 영역
      image, // 원본 이미지
      crop.x, // 크롭한 이미지 x 좌표
      crop.y, // 크롭한 이미지 y 좌표
      crop.width, // 크롭한 이미지 가로 길이
      crop.height, // 크롭한 이미지 세로 길이
      // 캔버스 영역
      0, // 캔버스에서 이미지 시작 x 좌표
      0, // 캔버스에서 이미지 시작 y 좌표
      crop.width, // 캔버스에서 이미지 가로 길이
      crop.height //  캔버스에서 이미지 세로 길이
    );

    // canvas 이미지를 base64 형식으로 인코딩된 URI 를 생성한 후 반환한다
    return new Promise(resolve => {
      resolve(canvas.toDataURL());
    });
}
```

먼저 캔버스(canvas) 요소를 생성한 뒤, 가로 길이와 세로 길이를 크롭한 이미지의 것과 같게 만들어준다. 그런 다음, 렌더링에 관련된 메서드를 사용하기 위해 `getContext()` 메서드를 호출하고 이를 `ctx` 라고 하였다. 다음으로 캔버스에 이미지를 그리는 `drawImage()` 함수를 호출하여 적절한 옵션을 부여하여 크롭된 이미지를 캔버스상에 나타내었다. 최종적으로 해당 캔버스에 나타난 이미지의 URI 를 생성하여 이를 반환하였다

## 3. 사용자가 편집한 이미지를 서버에 전송한다
